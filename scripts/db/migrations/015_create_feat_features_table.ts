/**
 * @fileoverview Migration 014 — Create feat_features table
 * @description Creates the `feat_features` child table, which stores named
 * mechanics (bold bullet items) parsed from feat MDX files. Each row belongs
 * to a parent feat row via a cascading foreign key.
 *
 * After applying this migration, run `npx tsx scripts/db/pg/seed-from-fs.ts`
 * to backfill the new rows from the regenerated `.metadata.json` sidecars.
 *
 * @module scripts/db/migrations/015_create_feat_features_table
 * @author Typeir
 * @version 1.0.0
 * @since 9.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 014: creates the `feat_features` table and its
 * `feat_id` index.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS feat_features (
      id         serial  PRIMARY KEY,
      feat_id    integer NOT NULL REFERENCES feats(id) ON DELETE CASCADE,
      name       text    NOT NULL,
      sort_order smallint NOT NULL DEFAULT 0,
      start_line smallint,
      end_line   smallint,
      tags       text[]  NOT NULL DEFAULT '{}'
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS feat_features_feat_id_idx
      ON feat_features(feat_id)
  `);
}

/**
 * Reverts migration 014: drops the `feat_features` table (cascade removes
 * the index automatically).
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS feat_features`);
}
