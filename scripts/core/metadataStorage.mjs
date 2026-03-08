/**
 * @fileoverview Metadata Persistence Storage for Build Scripts
 * @description Provides a lightweight Postgres storage adapter for use in
 * Node.js build scripts. Handles upserting canonical metadata records into
 * the `content_metadata` table that the runtime content adapters read from.
 *
 * This module is script-side only — it uses `pg` directly and has no
 * dependency on the Next.js runtime or the TypeScript source tree.
 *
 * @module scripts/core/metadataStorage
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires pg PostgreSQL client
 *
 * @example
 * ```bash
 * # Persist metadata to database via CLI flag
 * node scripts/metadata/generateMonsterMetadata.mjs --persist
 * node scripts/metadata/generateMetadata.mjs --persist
 * ```
 *
 * @example
 * ```javascript
 * // Programmatic usage
 * import { createPostgresStorage } from '../core/metadataStorage.mjs';
 * const storage = createPostgresStorage(process.env.DATABASE_URL);
 * await storage.ensureTable();
 * await storage.upsert('monsters', 'en', 'goblin', { slug: 'goblin', name: 'Goblin' });
 * await storage.close();
 * ```
 */

import pg from 'pg';

const { Pool } = pg;

/* ──────────────────────  Postgres Storage  ─────────────────────────── */

/**
 * Creates a Postgres-backed metadata storage instance.
 *
 * @param {string} connectionString - PostgreSQL connection URL (e.g. `DATABASE_URL`)
 * @returns {{ ensureTable: Function, upsert: Function, upsertBatch: Function, close: Function }}
 */
export function createPostgresStorage(connectionString) {
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    /**
     * Creates the `content_metadata` table and index if they do not exist.
     *
     * @returns {Promise<void>}
     */
    async ensureTable() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS content_metadata (
          id       SERIAL PRIMARY KEY,
          category TEXT NOT NULL,
          locale   TEXT NOT NULL DEFAULT 'en',
          slug     TEXT NOT NULL,
          data     JSONB NOT NULL,
          UNIQUE (category, locale, slug)
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_content_metadata_cat_locale
          ON content_metadata (category, locale)
      `);
    },

    /**
     * Upserts a single metadata record.
     *
     * @param {string} category - Content category (e.g. 'monsters', 'spells')
     * @param {string} locale - Locale code (e.g. 'en')
     * @param {string} slug - Unique content slug
     * @param {object} data - JSON-serialisable metadata object
     * @returns {Promise<void>}
     */
    async upsert(category, locale, slug, data) {
      await pool.query(
        `INSERT INTO content_metadata (category, locale, slug, data)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (category, locale, slug)
         DO UPDATE SET data = EXCLUDED.data`,
        [category, locale, slug, JSON.stringify(data)],
      );
    },

    /**
     * Upserts many records in a single transaction.
     *
     * @param {{ category: string, locale: string, slug: string, data: object }[]} records
     * @returns {Promise<number>} Number of records upserted
     */
    async upsertBatch(records) {
      if (records.length === 0) return 0;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const r of records) {
          await client.query(
            `INSERT INTO content_metadata (category, locale, slug, data)
             VALUES ($1, $2, $3, $4::jsonb)
             ON CONFLICT (category, locale, slug)
             DO UPDATE SET data = EXCLUDED.data`,
            [r.category, r.locale, r.slug, JSON.stringify(r.data)],
          );
        }
        await client.query('COMMIT');
        return records.length;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    /**
     * Shuts down the connection pool.
     *
     * @returns {Promise<void>}
     */
    async close() {
      await pool.end();
    },
  };
}

/* ──────────────────────  Convenience helpers  ─────────────────────── */

/**
 * Creates a Postgres storage instance from the `DATABASE_URL` env var.
 * Calls `ensureTable()` before returning so the schema is ready to use.
 *
 * @returns {Promise<ReturnType<typeof createPostgresStorage>>}
 * @throws {Error} If `DATABASE_URL` is not set
 */
export async function createStorageFromEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot persist to database.');
  }
  const storage = createPostgresStorage(url);
  await storage.ensureTable();
  return storage;
}
