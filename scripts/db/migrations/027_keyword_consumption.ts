/**
 * @fileoverview Migration 027: bidirectional keyword consumption arrays.
 * @description `consumes` lists the shard references a file declares; `consumers`
 * lists the files declaring a reference into it.
 *
 * @module scripts/db/migrations/027_keyword_consumption
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/** File-level content tables. Feature children are addressed through their parent. */
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
 * Add `consumes` and `consumers` text arrays to every file-level content table.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  for (const table of TABLES) {
    await client.query(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS consumes text[] NOT NULL DEFAULT '{}'`,
    );
    await client.query(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS consumers text[] NOT NULL DEFAULT '{}'`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${table}_consumes_gin_idx ON ${table} USING GIN (consumes)`,
    );
  }
}

/**
 * Drop both arrays and their indexes.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  for (const table of TABLES) {
    await client.query(`DROP INDEX IF EXISTS ${table}_consumes_gin_idx`);
    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS consumers`);
    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS consumes`);
  }
}
