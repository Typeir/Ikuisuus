/**
 * @fileoverview PostgreSQL Migration Runner
 * @description Runs pending SQL migrations from `scripts/db/migrations/` in
 * alphabetical order. Uses raw pg Pool to execute SQL and track applied
 * migrations in the `schema_migrations` table.
 *
 * Idempotent — safe to run on every deploy. Migrations that have already been
 * applied are skipped without error.
 *
 * Convention: migration files must be named `NNN_description.sql` where `NNN`
 * is a zero-padded integer (e.g. `001_drop_ability_modifiers.sql`).
 *
 * Usage:
 *   node scripts/db/pg/migrate.mjs
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { readFileSync, readdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { createLogger } from '../../core/logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');
const ROOT = join(__dirname, '../../../');
const log = createLogger({ script: 'migrate' });

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
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

/* ────────────────────────  Helpers  ────────────────────────────────── */

/**
 * Returns all `.sql` migration files sorted alphabetically.
 *
 * @returns {string[]} Array of absolute file paths
 */
function getMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join(MIGRATIONS_DIR, f));
}

/* ──────────────────────  Core runner  ──────────────────────────────── */

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text        PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows: applied } = await pool.query(
      'SELECT name FROM schema_migrations',
    );
    const appliedSet = new Set(applied.map((m) => m.name));

    const files = getMigrationFiles();
    const pending = files.filter((f) => !appliedSet.has(basename(f)));

    if (pending.length === 0) {
      log.message('✅  No pending migrations — database is up to date.');
      return;
    }

    log.message(`🔄  Running ${pending.length} pending migration(s)…`);

    for (const file of pending) {
      const name = basename(file);
      const sql = readFileSync(file, 'utf8');

      log.message(`   ▶  ${name}`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          name,
        ]);
        await client.query('COMMIT');
        log.message(`   ✓  ${name} applied.`);
      } catch (err) {
        await client.query('ROLLBACK');
        log.error(`   ✗  ${name} FAILED: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    log.message('🎉  All migrations complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  log.error('❌  Migration runner error:', err.message);
  process.exit(1);
});
