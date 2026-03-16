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
 * npx tsx scripts/metadata/generateMonsterMetadata.ts --persist
 * npx tsx scripts/metadata/generateMetadata.ts --persist
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic usage
 * import { createPostgresStorage } from '../core/metadataStorage';
 * const storage = createPostgresStorage(process.env.DATABASE_URL!);
 * await storage.ensureTable();
 * await storage.upsert('monsters', 'en', 'goblin', { slug: 'goblin', name: 'Goblin' });
 * await storage.close();
 * ```
 */

import pg from 'pg';

const { Pool } = pg;

/**
 * Record shape for batch upserts.
 */
interface MetadataRecord {
  /** Content category (e.g. 'monsters', 'spells') */
  category: string;
  /** Locale code (e.g. 'en') */
  locale: string;
  /** Unique content slug */
  slug: string;
  /** JSON-serialisable metadata object */
  data: Record<string, unknown>;
}

/**
 * Postgres-backed metadata storage interface.
 */
interface PostgresStorage {
  /** Creates the `content_metadata` table and index if they do not exist. */
  ensureTable: () => Promise<void>;
  /** Upserts a single metadata record. */
  upsert: (category: string, locale: string, slug: string, data: Record<string, unknown>) => Promise<void>;
  /** Upserts many records in a single transaction. */
  upsertBatch: (records: MetadataRecord[]) => Promise<number>;
  /** Shuts down the connection pool. */
  close: () => Promise<void>;
}

/* ──────────────────────  Postgres Storage  ─────────────────────────── */

/**
 * Creates a Postgres-backed metadata storage instance.
 *
 * @param connectionString - PostgreSQL connection URL (e.g. `DATABASE_URL`)
 * @returns Storage adapter with ensureTable, upsert, upsertBatch, and close methods
 */
export function createPostgresStorage(connectionString: string): PostgresStorage {
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    async ensureTable(): Promise<void> {
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

    async upsert(category: string, locale: string, slug: string, data: Record<string, unknown>): Promise<void> {
      await pool.query(
        `INSERT INTO content_metadata (category, locale, slug, data)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (category, locale, slug)
         DO UPDATE SET data = EXCLUDED.data`,
        [category, locale, slug, JSON.stringify(data)],
      );
    },

    async upsertBatch(records: MetadataRecord[]): Promise<number> {
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

    async close(): Promise<void> {
      await pool.end();
    },
  };
}

/* ──────────────────────  Convenience helpers  ─────────────────────── */

/**
 * Creates a Postgres storage instance from the `DATABASE_URL` env var.
 * Calls `ensureTable()` before returning so the schema is ready to use.
 *
 * @returns Initialized storage instance
 * @throws If `DATABASE_URL` is not set
 */
export async function createStorageFromEnv(): Promise<PostgresStorage> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot persist to database.');
  }
  const storage = createPostgresStorage(url);
  await storage.ensureTable();
  return storage;
}
