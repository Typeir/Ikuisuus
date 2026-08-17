/**
 * @fileoverview Migration 025 — Feature headings, feature tags, bloodline features
 * @description Monster, vocation and specialization features gain the raw heading
 * text they render under and their extracted aspects; bloodlines gain a
 * `bloodline_features` child table for core-feature traits, mirroring
 * `bloodline_boons`; boon options written as their own headings carry
 * `parent_name`.
 *
 * After applying, run `npx tsx scripts/db/pg/seed-from-fs.ts` to backfill.
 *
 * @module scripts/db/migrations/025_feature_headings_and_bloodline_features
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 025.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monster_features ADD COLUMN IF NOT EXISTS heading text`);
  await client.query(`ALTER TABLE bloodline_boons ADD COLUMN IF NOT EXISTS parent_name text`);
  await client.query(`ALTER TABLE vocation_features ADD COLUMN IF NOT EXISTS heading text`);
  await client.query(`ALTER TABLE vocation_features ADD COLUMN IF NOT EXISTS tags text[]`);
  await client.query(`ALTER TABLE specialization_features ADD COLUMN IF NOT EXISTS heading text`);
  await client.query(`ALTER TABLE specialization_features ADD COLUMN IF NOT EXISTS tags text[]`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS bloodline_features (
      id            serial   PRIMARY KEY,
      bloodline_id  integer  NOT NULL REFERENCES bloodlines(id) ON DELETE CASCADE,
      feature_id    text     NOT NULL,
      name          text     NOT NULL,
      sort_order    smallint NOT NULL DEFAULT 0,
      start_line    smallint,
      end_line      smallint,
      tags          text[]   NOT NULL DEFAULT '{}'
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodline_features_bloodline_id_idx
      ON bloodline_features(bloodline_id)
  `);
}

/**
 * Reverts migration 025.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS bloodline_features`);
  await client.query(`ALTER TABLE specialization_features DROP COLUMN IF EXISTS tags`);
  await client.query(`ALTER TABLE specialization_features DROP COLUMN IF EXISTS heading`);
  await client.query(`ALTER TABLE vocation_features DROP COLUMN IF EXISTS tags`);
  await client.query(`ALTER TABLE vocation_features DROP COLUMN IF EXISTS heading`);
  await client.query(`ALTER TABLE bloodline_boons DROP COLUMN IF EXISTS parent_name`);
  await client.query(`ALTER TABLE monster_features DROP COLUMN IF EXISTS heading`);
}
