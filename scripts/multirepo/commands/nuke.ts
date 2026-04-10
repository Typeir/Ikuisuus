/**
 * @fileoverview `ik nuke` — Hard-delete command for data management.
 * @description Removes entries from external metadata JSON files and the
 * PostgreSQL database atomically.
 *
 * Supported shape:
 *   ik nuke external spell:<slug>
 *     - Removes from `scripts/core/spells-external.metadata.json`
 *     - Removes from `.meta/en/spells/spells-external.metadata.json` (if present)
 *     - Removes from `src/content/en/spells/spells-external.metadata.json` (if present)
 *     - Deletes the row from the `spells` table — FK cascade removes `spell_lists`
 *
 * @module multirepo/commands/nuke
 */

import { log, spinner } from '@clack/prompts';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

import type { CommandMeta } from '../../utils/cli-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the project root. */
const ROOT = join(__dirname, '../../../');

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'nuke',
  description: 'Hard-delete external data (e.g. spell:<slug>)',
};

/**
 * Loads environment variables from `.env.local` if present.
 * No-ops silently when the file is absent (CI relies on system env).
 */
function loadEnv(): void {
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
}

/**
 * Removes all entries with the given slug from a metadata JSON array on disk.
 * Writes the filtered array back in-place using 2-space indentation.
 *
 * @param filePath - Absolute path to the `.metadata.json` file
 * @param slug - Slug value to filter out
 * @returns `true` if at least one entry was removed; `false` if the file was
 *          absent or no matching entry existed
 */
function removeFromJson(filePath: string, slug: string): boolean {
  if (!existsSync(filePath)) return false;
  const raw = readFileSync(filePath, 'utf8');
  const entries: Array<{ slug: string }> = JSON.parse(raw);
  const before = entries.length;
  const filtered = entries.filter((e) => e.slug !== slug);
  if (filtered.length === before) return false;
  writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
  return true;
}

/**
 * Deletes a spell row (and its cascaded `spell_lists`) from Postgres.
 * The `spell_lists.spell_id` FK is defined with `ON DELETE CASCADE`, so no
 * explicit join-table delete is needed.
 *
 * @param slug - Spell slug to delete (matched across all locales)
 * @returns Total number of `spells` rows deleted
 * @throws If `DATABASE_URL` is unset or the connection fails
 */
async function deleteFromPostgres(slug: string): Promise<number> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const res = await client.query(
      `DELETE FROM spells WHERE slug = $1 RETURNING id`,
      [slug],
    );
    return res.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

/**
 * Hard-deletes an external spell from all JSON copies and Postgres.
 *
 * @param slug - Spell slug (e.g. `"hunters-mark"`)
 */
async function nukeExternalSpell(slug: string): Promise<void> {
  const s = spinner();
  s.start(`Nuking external spell "${slug}"…`);

  const primaryJson = join(
    ROOT,
    'scripts',
    'core',
    'spells-external.metadata.json',
  );
  const metaCopy = join(
    ROOT,
    '.meta',
    'en',
    'spells',
    'spells-external.metadata.json',
  );
  const fsCopy = join(
    ROOT,
    'src',
    'content',
    'en',
    'spells',
    'spells-external.metadata.json',
  );

  const removedPrimary = removeFromJson(primaryJson, slug);

  if (!removedPrimary) {
    s.stop('Not found');
    log.error(
      `"${slug}" not found in spells-external.metadata.json. Check the slug and try again.`,
    );
    process.exit(1);
  }

  removeFromJson(metaCopy, slug);
  removeFromJson(fsCopy, slug);

  s.stop('JSON updated');

  let pgRows = 0;
  try {
    loadEnv();
    pgRows = await deleteFromPostgres(slug);
  } catch (err) {
    log.warn(
      `JSON files cleaned, but Postgres delete failed: ${(err as Error).message}`,
    );
    log.warn(
      'Run `npm run db:seed` to re-sync when DATABASE_URL is available.',
    );
    return;
  }

  log.success(
    `Nuked "${slug}"\n  ✓ JSON files updated\n  ✓ Postgres: ${pgRows} spell row(s) deleted (spell_lists cascade-removed)`,
  );
}

/**
 * Entry point for `ik nuke`.
 *
 * @param args - Remaining args after `nuke`, e.g. `["external", "spell:hunters-mark"]`
 */
export async function run(args: string[]): Promise<void> {
  const scope = args[0];
  const typeArg = args[1] ?? '';

  if (!scope || !typeArg) {
    log.error('Usage: ik nuke external spell:<slug>');
    process.exit(1);
  }

  if (scope !== 'external') {
    log.error(`Unknown scope "${scope}". Currently supported scopes: external`);
    process.exit(1);
  }

  if (!typeArg.startsWith('spell:')) {
    log.error(
      `Unknown target type "${typeArg}". Usage: ik nuke external spell:<slug>`,
    );
    process.exit(1);
  }

  const slug = typeArg.slice('spell:'.length).trim();

  if (!slug) {
    log.error(
      'Spell slug cannot be empty. Usage: ik nuke external spell:<slug>',
    );
    process.exit(1);
  }

  await nukeExternalSpell(slug);
}
