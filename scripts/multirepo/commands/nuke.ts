/**
 * @fileoverview Hard-deletes a spell row from Postgres by slug.
 * @description Accepts `ik nuke spell:<slug>`. Deletes the `spells` row; FK
 * cascade removes matching `spell_lists` rows.
 *
 * @module multirepo/commands/nuke
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { log, spinner } from '@clack/prompts';
import { readFileSync } from 'fs';
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
  description: 'Hard-delete spell data from the database (e.g. spell:<slug>)',
};

/**
 * Loads environment variables from `.env.local` if present; no-ops when absent.
 *
 * @returns {void}
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
 * Deletes a spell row from Postgres; `spell_lists` rows cascade via FK.
 *
 * @param {string} slug - Spell slug to delete (matched across all locales)
 * @returns {Promise<number>} Total number of `spells` rows deleted
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
 * Hard-deletes a spell from Postgres.
 *
 * @param {string} slug - Spell slug (e.g. `"hunters-mark"`)
 * @returns {Promise<void>}
 */
async function nukeSpell(slug: string): Promise<void> {
  const s = spinner();
  s.start(`Nuking spell "${slug}"…`);

  let pgRows = 0;
  try {
    loadEnv();
    pgRows = await deleteFromPostgres(slug);
  } catch (err) {
    s.stop('Failed');
    log.error(
      `Postgres delete failed: ${(err as Error).message}`,
    );
    log.warn(
      'Run `npm run db:seed` to re-sync when DATABASE_URL is available.',
    );
    return;
  }

  s.stop('Done');
  log.success(
    `Nuked "${slug}"\n  ✓ Postgres: ${pgRows} spell row(s) deleted (spell_lists cascade-removed)`,
  );
}

/**
 * Entry point for `ik nuke`.
 *
 * @param {string[]} args - Remaining args after `nuke`, e.g. `["spell:hunters-mark"]`
 * @returns {Promise<void>}
 */
export async function run(args: string[]): Promise<void> {
  const typeArg = args[0] ?? '';

  if (!typeArg) {
    log.error('Usage: ik nuke spell:<slug>');
    process.exit(1);
  }

  if (!typeArg.startsWith('spell:')) {
    log.error(
      `Unknown target type "${typeArg}". Usage: ik nuke spell:<slug>`,
    );
    process.exit(1);
  }

  const slug = typeArg.slice('spell:'.length).trim();

  if (!slug) {
    log.error(
      'Spell slug cannot be empty. Usage: ik nuke spell:<slug>',
    );
    process.exit(1);
  }

  await nukeSpell(slug);
}
