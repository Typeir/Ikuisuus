/**
 * @fileoverview Backfill spell_lists from vocation spells.mdx files
 * @description Parses each vocation's spells.mdx to extract the spell slug array
 * from the SpellTable component's `spells` prop, cross-references against the
 * `spells` table in Postgres, and inserts matching `spell_lists` rows.
 *
 * Safe to run multiple times: deletes existing spell_lists for each vocation link
 * before re-inserting (no unique constraint exists on the table).
 *
 * @module backfill-spell-lists
 * @version 1.0.0
 * @since 1.0.0
 *
 * Usage:
 *   npx tsx scripts/db/pg/backfill-spell-lists.ts
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { createLogger } from '@/lib/logging/logger';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');
const log = createLogger({ script: 'backfill-spell-lists' });

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local absent — rely on system env */
}

if (!process.env.DATABASE_URL) {
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

/* ──────────────────────  Vocation definitions  ────────────────────── */

const LOCALE = 'en';

/** Vocation definition */
interface Vocation {
  /** Display name */
  name: string;
  /** URL slug */
  slug: string;
}

const VOCATIONS: Vocation[] = [
  { name: 'Bard', slug: 'bard' },
  { name: 'Cleric', slug: 'cleric' },
  { name: 'Druid', slug: 'druid' },
  { name: 'Esper', slug: 'esper' },
  { name: 'Paladin', slug: 'paladin' },
  { name: 'Ranger', slug: 'ranger' },
  { name: 'Revenant', slug: 'revenant' },
  { name: 'Sorcerer', slug: 'sorcerer' },
  { name: 'Tinker', slug: 'tinker' },
  { name: 'Warlock', slug: 'warlock' },
  { name: 'Wizard', slug: 'wizard' },
];

/**
 * Resolves the filesystem path for a vocation's spells.mdx.
 *
 * @param vocationSlug - Kebab-case vocation slug
 * @returns Absolute file path
 */
function vocationFilePath(vocationSlug: string): string {
  return join(
    ROOT,
    'src/content/en/character-creation/vocations',
    vocationSlug,
    'spells.mdx',
  );
}

/**
 * Derives the canonical link for a vocation spell list page.
 *
 * @param vocationSlug - Kebab-case vocation slug
 * @returns URL path
 */
function vocationLink(vocationSlug: string): string {
  return `/en/library/character-creation/vocations/${vocationSlug}/spells`;
}

/* ──────────────────────  MDX slug extraction  ─────────────────────── */

/**
 * Reads a vocation's spells.mdx and extracts the spell slug array from the
 * SpellTable `spells={[...]}` prop.
 *
 * @param filePath - Absolute path to the .mdx file
 * @returns Array of spell slugs
 */
function extractSpellSlugs(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8');

  const arrayMatch = content.match(/spells=\{\[\s*([\s\S]*?)\]\}/);
  if (!arrayMatch) {
    log.message(`  ⚠  No spells={[...]} prop found in ${filePath}`);
    return [];
  }

  const slugs: string[] = [];
  const slugPattern = /["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = slugPattern.exec(arrayMatch[1])) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

/* ──────────────────────  DB backfill logic  ────────────────────────── */

/**
 * Processes a single vocation: deletes stale spell_lists rows, resolves slugs
 * against the spells table, and inserts fresh spell_lists rows.
 *
 * @param client - Transaction-bound pg client
 * @param vocation - Vocation definition
 * @returns Results with insert count and unmatched slugs
 */
async function processVocation(
  client: pg.PoolClient,
  vocation: Vocation,
): Promise<{ inserted: number; unmatched: string[] }> {
  const filePath = vocationFilePath(vocation.slug);
  const link = vocationLink(vocation.slug);
  const slugs = extractSpellSlugs(filePath);

  if (slugs.length === 0) {
    return { inserted: 0, unmatched: [] };
  }

  await client.query('DELETE FROM spell_lists WHERE link = $1', [link]);

  const { rows } = await client.query(
    'SELECT id, slug FROM spells WHERE locale = $1 AND slug = ANY($2::text[])',
    [LOCALE, slugs],
  );

  const slugToId = new Map<string, number>(rows.map((r) => [r.slug, r.id]));

  const matched: { spellId: number; name: string; link: string }[] = [];
  const unmatched: string[] = [];

  for (const slug of slugs) {
    const spellId = slugToId.get(slug);
    if (spellId !== undefined) {
      matched.push({ spellId, name: vocation.name, link });
    } else {
      unmatched.push(slug);
    }
  }

  if (matched.length > 0) {
    const placeholders = matched
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(', ');
    const values = matched.flatMap((m) => [m.spellId, m.name, m.link]);

    await client.query(
      `INSERT INTO spell_lists (spell_id, name, link) VALUES ${placeholders}`,
      values,
    );
  }

  return { inserted: matched.length, unmatched };
}

/* ─────────────────────────  Main  ─────────────────────────────────── */

async function main(): Promise<void> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10_000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    log.message(
      `🔄  Backfilling spell_lists for ${VOCATIONS.length} vocations…`,
    );

    let totalInserted = 0;
    const allUnmatched: { vocation: string; slugs: string[] }[] = [];

    for (const vocation of VOCATIONS) {
      const { inserted, unmatched } = await processVocation(client, vocation);
      totalInserted += inserted;

      if (unmatched.length > 0) {
        allUnmatched.push({ vocation: vocation.name, slugs: unmatched });
      }

      log.message(
        `  ✅  ${vocation.name}: ${inserted} spell_lists inserted` +
          (unmatched.length > 0 ? `, ${unmatched.length} unmatched` : ''),
      );
    }

    await client.query('COMMIT');

    log.message(
      `🏁  Backfill complete: ${totalInserted} total spell_lists rows inserted.`,
    );

    if (allUnmatched.length > 0) {
      log.message('\n⚠  Unmatched slugs (in .mdx but not in spells table):');
      for (const { vocation, slugs } of allUnmatched) {
        log.message(`  ${vocation}: ${slugs.join(', ')}`);
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('❌  Backfill failed:', { error: message });
  process.exit(1);
});
