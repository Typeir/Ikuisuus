/**
 * @fileoverview Migration 028: keyword production array.
 * @description `produces` lists the shard ids a file defines, completing the
 * pair 027 opened.
 *
 * @module scripts/db/migrations/028_keyword_production
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/** File-level content tables. */
const TABLES = [
  'bloodlines',
  'feats',
  'heirlooms',
  'monsters',
  'rules',
  'specializations',
  'spells',
  'trinkets',
  'vocations',
  'world',
] as const;

/**
 * Add `produces` to every file-level content table, indexed for containment.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  for (const table of TABLES) {
    await client.query(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS produces text[] NOT NULL DEFAULT '{}'`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${table}_produces_gin_idx ON ${table} USING GIN (produces)`,
    );
  }
}

/**
 * Drop the array and its index.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  for (const table of TABLES) {
    await client.query(`DROP INDEX IF EXISTS ${table}_produces_gin_idx`);
    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS produces`);
  }
}
