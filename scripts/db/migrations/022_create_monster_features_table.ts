/**
 * @fileoverview Migration 022 — Create monster_features table
 * @description Creates the `monster_features` child table storing feature
 * shards parsed from monster stat blocks. Each row belongs to a parent
 * monster row via a cascading foreign key.
 *
 * After applying, run `npx tsx scripts/db/pg/seed-from-fs.ts` to backfill the
 * rows from regenerated sidecars.
 *
 * @module scripts/db/migrations/022_create_monster_features_table
 * @author Typeir
 * @version 1.0.0
 * @since 9.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 022: creates the `monster_features` table and its
 * `monster_id` index.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS monster_features (
      id          serial   PRIMARY KEY,
      monster_id  integer  NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
      feature_id  text     NOT NULL,
      name        text     NOT NULL,
      trigger     text,
      sort_order  smallint NOT NULL DEFAULT 0,
      start_line  smallint,
      end_line    smallint,
      tags        text[]   NOT NULL DEFAULT '{}'
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS monster_features_monster_id_idx
      ON monster_features(monster_id)
  `);
}

/**
 * Reverts migration 022: drops the `monster_features` table (cascade removes
 * the index automatically).
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS monster_features`);
}
