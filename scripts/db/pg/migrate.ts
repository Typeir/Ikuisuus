/**
 * @fileoverview PostgreSQL Migration Runner
 * @description Runs pending migrations from `scripts/db/migrations/` in
 * alphabetical order. Supports legacy `.sql` files (read and executed as raw
 * SQL) and TypeScript migration modules that export `up(client)` /
 * `down(client)` functions.
 *
 * Pass `--down` to roll back the most recently applied migration.
 *
 * Usage:
 *   npx tsx scripts/db/pg/migrate.ts          # apply pending migrations
 *   npx tsx scripts/db/pg/migrate.ts --down   # roll back last migration
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 *
 * @module scripts/db/pg/migrate
 */

import { readFileSync, readdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import pg, { type PoolClient } from 'pg';
import { fileURLToPath, pathToFileURL } from 'url';
import { createLogger } from '@/lib/logging/logger';

/**
 * Contract for TypeScript migration modules.
 *
 * @interface MigrationModule
 * @property {Function} up - Apply the migration inside an active transaction.
 * @property {Function} down - Reverse the migration inside an active transaction.
 */
interface MigrationModule {
  up(client: PoolClient): Promise<void>;
  down(client: PoolClient): Promise<void>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');
const ROOT = join(__dirname, '../../../');
const log = createLogger({ script: 'migrate' });

/**
 * Advisory lock ID that prevents two migration runners from operating
 * on the same database concurrently.
 */
const MIGRATION_LOCK_ID = 73917391;

loadEnv();

/**
 * Parses `.env.local` and injects any missing keys into `process.env`.
 * Silently no-ops when the file is absent (production relies on system env).
 */
function loadEnv(): void {
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
}

if (!process.env.DATABASE_URL) {
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

/**
 * Returns all migration files (`.sql` and `.ts`) in the migrations directory,
 * sorted alphabetically so they apply in the correct sequence.
 *
 * @returns {string[]} Absolute file paths.
 */
function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.ts'))
    .sort()
    .map((f) => join(MIGRATIONS_DIR, f));
}

/**
 * Executes the `up` phase of one migration inside an already-open transaction.
 * TypeScript modules have their exported `up(client)` called directly.
 * SQL files are read from disk and forwarded as a single query string.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @param {string} file - Absolute path to the migration file.
 * @returns {Promise<void>}
 */
async function runUp(client: PoolClient, file: string): Promise<void> {
  if (file.endsWith('.ts')) {
    const mod = (await import(pathToFileURL(file).href)) as MigrationModule;
    await mod.up(client);
  } else {
    const sql = readFileSync(file, 'utf8');
    await client.query(sql);
  }
}

/**
 * Executes the `down` phase of one migration inside an already-open transaction.
 * Only TypeScript migration modules support rollback; attempting to roll back a
 * raw SQL file exits with an error.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @param {string} file - Absolute path to the migration file.
 * @returns {Promise<void>}
 */
async function runDown(client: PoolClient, file: string): Promise<void> {
  if (!file.endsWith('.ts')) {
    log.error(
      `   ✗  down() is not supported for SQL migrations. Convert ${basename(file)} to TypeScript first.`,
    );
    process.exit(1);
  }
  const mod = (await import(pathToFileURL(file).href)) as MigrationModule;
  await mod.down(client);
}

/**
 * Applies all unapplied migrations in ascending alphabetical order.
 * Each migration runs in its own transaction; a failure rolls back only that
 * migration and halts the runner.
 *
 * @param {pg.Pool} pool - Active connection pool.
 * @returns {Promise<void>}
 */
async function runUpCommand(pool: pg.Pool): Promise<void> {
  const { rows: applied } = await pool.query(
    'SELECT name FROM schema_migrations',
  );
  const appliedSet = new Set(applied.map((m: { name: string }) => m.name));

  const files = getMigrationFiles();
  const pending = files.filter((f) => !appliedSet.has(basename(f)));

  if (pending.length === 0) {
    log.message('✅  No pending migrations — database is up to date.');
    return;
  }

  log.message(`🔄  Running ${pending.length} pending migration(s)…`);

  for (const file of pending) {
    const name = basename(file);
    log.message(`   ▶  ${name}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await runUp(client, file);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        name,
      ]);
      await client.query('COMMIT');
      log.message(`   ✓  ${name} applied.`);
    } catch (err) {
      await client.query('ROLLBACK');
      log.error(`   ✗  ${name} FAILED: ${(err as Error).message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  log.message('🎉  All migrations complete.');
}

/**
 * Rolls back the most recently applied migration by calling its `down()`
 * function and removing the entry from `schema_migrations`.
 *
 * @param {pg.Pool} pool - Active connection pool.
 * @returns {Promise<void>}
 */
async function runDownCommand(pool: pg.Pool): Promise<void> {
  const { rows } = await pool.query(
    'SELECT name FROM schema_migrations ORDER BY applied_at DESC LIMIT 1',
  );

  if (rows.length === 0) {
    log.message('✅  Nothing to roll back — no migrations have been applied.');
    return;
  }

  const name = rows[0].name as string;
  const files = getMigrationFiles();
  const file = files.find((f) => basename(f) === name);

  if (!file) {
    log.error(`   ✗  Cannot roll back: migration file not found for "${name}"`);
    process.exit(1);
  }

  log.message(`   ▼  Rolling back ${name}…`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await runDown(client, file);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
    await client.query('COMMIT');
    log.message(`   ✓  ${name} rolled back.`);
  } catch (err) {
    await client.query('ROLLBACK');
    log.error(`   ✗  ${name} rollback FAILED: ${(err as Error).message}`);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Entry point. Acquires an advisory lock, delegates to up or down command,
 * then releases the lock.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const isDown = process.argv.includes('--down');

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

    const { rows: lockRows } = await pool.query(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [MIGRATION_LOCK_ID],
    );

    if (!lockRows[0].acquired) {
      log.message(
        '⏳  Another migration runner holds the lock — skipping this run.',
      );
      return;
    }

    try {
      if (isDown) {
        await runDownCommand(pool);
      } else {
        await runUpCommand(pool);
      }
    } finally {
      await pool.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err: Error) => {
  log.error('❌  Migration runner error:', { error: err.message });
  process.exit(1);
});
