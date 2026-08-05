/**
 * @fileoverview Migration 022 — Create monster_features table
 * @description Creates the `monster_features` child table, which stores the
 * feature shards parsed from monster stat blocks. Each row belongs to a parent
 * monster row via a cascading foreign key.
 *
 * Monsters were the one content kind whose feature shards had no table.
 * Vocations, specializations, feats and bloodlines all carry theirs, so the
 * shards existed in the `.metadata.json` sidecars — the dev backend — and
 * nowhere in the live one. Anything reading a feature therefore worked in dev
 * and returned nothing in production, which is the failure shape that never
 * announces itself.
 *
 * After applying this migration, run `npx tsx scripts/db/pg/seed-from-fs.ts`
 * to backfill the new rows from the regenerated sidecars.
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
