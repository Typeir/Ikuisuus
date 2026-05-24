/**
 * @fileoverview Migration: Tag native Ikuisuus spells with source: Ikuisuus
 * @description One-shot script that adds `source: Ikuisuus` to the YAML frontmatter
 * of each native Damocles spell MDX file, patches the corresponding
 * `.metadata.json` sidecar files, and (when DATABASE_URL is set) issues a
 * bulk `UPDATE spells SET source = 'Ikuisuus'` for the same slug set in the
 * `en` locale.
 *
 * Safe to re-run — idempotent for both the MDX frontmatter and the JSON sidecars.
 *
 * @module scripts/migrations/tagIkuisuusSpells
 * @author Typeir
 * @version 1.0.0
 * @since 7.3.0
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/migrations/tagIkuisuusSpells.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../');
const SPELLS_DIR = join(ROOT, 'src/content/en/spells');

/* ─────────────────────────────  Slug list  ─────────────────────────── */

/**
 * Canonical slugs for all native Ikuisuus spells that should carry
 * `source: Ikuisuus`.  Each entry must correspond to a `<slug>.mdx` file
 * inside `src/content/en/spells/`.
 *
 * @type {readonly string[]}
 */
const IKUISUUS_SLUGS: readonly string[] = [
  'abominable-grasp',
  'antimagic-shell',
  'asphyxiate',
  'bloodlash-rebuke',
  'burial-rites',
  'death-grips',
  'dread-steed',
  'earthmove',
  'eternal-return',
  'everburning-armament',
  'fate-tangle',
  'fated-fist',
  'festering-edge',
  'fold-deduplication',
  'forbidden-sun',
  'gaol',
  'golden-weave',
  'grave-siphon',
  'haruspicy',
  'hellfire-orb',
  'jaws-of-selkara',
  'kultharjas-mantle',
  'lesser-mooncleave',
  'lifetap',
  'lightning-edge',
  'minor-ice-rings',
  'nailed-to-the-sky',
  'null-fortress',
  'prophecy',
  'rite-of-empty-skies',
  'saintly-severer',
  'severing-orbit',
  'shadow-lore',
  'starpath',
  'sulfurous-sphere',
  'summon-rotworm',
  'threaded-blade',
  'true-light',
  'unstoppable-motion',
  'waltzing-blades',
] as const;

/* ─────────────────────────────  Helpers  ──────────────────────────── */

/**
 * Adds or updates `source: Ikuisuus` in a MDX file's YAML frontmatter.
 * Files without existing frontmatter receive a new block prepended.
 * Files whose frontmatter already contains `source:` have it replaced.
 * Already-correct files are left untouched.
 *
 * @param {string} filePath - Absolute path to the `.mdx` file.
 * @returns {'added' | 'updated' | 'skipped'} Outcome for reporting.
 */
function patchMdxFrontmatter(
  filePath: string,
): 'added' | 'updated' | 'skipped' {
  const raw = readFileSync(filePath, 'utf8');

  const hasFrontmatter = raw.startsWith('---\n') || raw.startsWith('---\r\n');

  if (hasFrontmatter) {
    const endIdx = raw.indexOf('\n---', 4);
    if (endIdx === -1) {
      return 'skipped';
    }
    const block = raw.slice(4, endIdx);
    if (/^source:\s*Ikuisuus\s*$/m.test(block)) {
      return 'skipped';
    }
    if (/^source:/m.test(block)) {
      const patched = raw.replace(/^(source:\s*).*$/m, 'source: Ikuisuus');
      writeFileSync(filePath, patched, 'utf8');
      return 'updated';
    }
    const patched =
      raw.slice(0, endIdx) + '\nsource: Ikuisuus' + raw.slice(endIdx);
    writeFileSync(filePath, patched, 'utf8');
    return 'added';
  }

  writeFileSync(filePath, `---\nsource: Ikuisuus\n---\n\n${raw}`, 'utf8');
  return 'added';
}

/**
 * Injects `"source": "Ikuisuus"` into the sidecar `.metadata.json` file.
 * Already-correct entries are left untouched.
 *
 * @param {string} jsonPath - Absolute path to the `.metadata.json` file.
 * @returns {'patched' | 'skipped' | 'missing'} Outcome for reporting.
 */
function patchMetadataJson(
  jsonPath: string,
): 'patched' | 'skipped' | 'missing' {
  if (!existsSync(jsonPath)) return 'missing';

  const raw = readFileSync(jsonPath, 'utf8');
  const entry: Record<string, unknown> = JSON.parse(raw);

  if (entry['source'] === 'Ikuisuus') return 'skipped';

  entry['source'] = 'Ikuisuus';
  writeFileSync(jsonPath, JSON.stringify(entry, null, 2), 'utf8');
  return 'patched';
}

/* ─────────────────────────────  DB patch  ─────────────────────────── */

/**
 * Attempts to load `.env.local` into `process.env` so the script can
 * locate `DATABASE_URL` in development without shell-level env injection.
 *
 * @returns {void}
 */
function loadDotEnvLocal(): void {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
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
    /* ignore */
  }
}

/**
 * Issues a bulk `UPDATE spells SET source = 'Ikuisuus'` for the slug set
 * in locale `en`.  Only executed when `DATABASE_URL` is present.
 *
 * @param {readonly string[]} slugs - Slug list to target.
 * @returns {Promise<number>} Number of rows updated.
 */
async function patchDatabase(slugs: readonly string[]): Promise<number> {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `UPDATE spells
         SET source = 'Ikuisuus'
       WHERE locale = 'en'
         AND slug = ANY($1::text[])`,
      [slugs as string[]],
    );
    return result.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

/* ─────────────────────────────  Main  ─────────────────────────────── */

/**
 * Entry point.  Processes all slugs sequentially and prints a summary.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  loadDotEnvLocal();

  const stats = {
    mdxAdded: 0,
    mdxUpdated: 0,
    mdxSkipped: 0,
    jsonPatched: 0,
    jsonSkipped: 0,
    jsonMissing: 0,
    missing: [] as string[],
  };

  for (const slug of IKUISUUS_SLUGS) {
    const mdxPath = join(SPELLS_DIR, `${slug}.mdx`);
    const jsonPath = join(SPELLS_DIR, `${slug}.metadata.json`);

    if (!existsSync(mdxPath)) {
      process.stderr.write(`  ⚠️  Missing MDX: ${slug}.mdx\n`);
      stats.missing.push(slug);
      continue;
    }

    const mdxResult = patchMdxFrontmatter(mdxPath);
    if (mdxResult === 'added') stats.mdxAdded++;
    else if (mdxResult === 'updated') stats.mdxUpdated++;
    else stats.mdxSkipped++;

    const jsonResult = patchMetadataJson(jsonPath);
    if (jsonResult === 'patched') stats.jsonPatched++;
    else if (jsonResult === 'skipped') stats.jsonSkipped++;
    else stats.jsonMissing++;
  }

  process.stdout.write('\n── MDX frontmatter ───────────────────────────────\n');
  process.stdout.write(`  added:   ${stats.mdxAdded}\n`);
  process.stdout.write(`  updated: ${stats.mdxUpdated}\n`);
  process.stdout.write(`  skipped: ${stats.mdxSkipped}\n`);
  process.stdout.write('\n── Metadata JSON ──────────────────────────────────\n');
  process.stdout.write(`  patched: ${stats.jsonPatched}\n`);
  process.stdout.write(`  skipped: ${stats.jsonSkipped}\n`);
  process.stdout.write(`  missing: ${stats.jsonMissing}\n`);

  if (stats.missing.length > 0) {
    process.stdout.write(
      `\n  ⚠️  MDX files not found: ${stats.missing.join(', ')}\n`,
    );
  }

  if (process.env.DATABASE_URL) {
    process.stdout.write('\n── PostgreSQL ──────────────────────────────────────\n');
    try {
      const rowsUpdated = await patchDatabase(IKUISUUS_SLUGS);
      process.stdout.write(`  rows updated: ${rowsUpdated}\n`);
    } catch (err) {
      process.stderr.write(
        `  ❌  DB update failed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  } else {
    process.stdout.write(
      '\n── PostgreSQL ──────────────────────────────────────\n',
    );
    process.stdout.write(
      '  DATABASE_URL not set — skipping DB patch.\n',
    );
  }

  process.stdout.write('\n✅  Done.\n');
}

main().catch((err) => {
  process.stderr.write(`❌  Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
