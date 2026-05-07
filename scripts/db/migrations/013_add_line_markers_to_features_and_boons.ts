/**
 * @fileoverview Migration 013 — Add start/end line markers to feature and boon rows
 * @description Adds `start_line` and `end_line` nullable smallint columns to
 * `vocation_features`, `specialization_features`, and `bloodline_boons`. These
 * columns store 1-indexed line offsets in the source MDX file, enabling
 * O(1) text extraction by the sharding layer without a full heading scan.
 *
 * @module scripts/db/migrations/013_add_line_markers_to_features_and_boons
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 013: adds `start_line` and `end_line` columns to the three
 * child tables that store per-feature or per-boon rules-text anchors.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS vocation_features
      ADD COLUMN IF NOT EXISTS start_line smallint,
      ADD COLUMN IF NOT EXISTS end_line   smallint
  `);

  await client.query(`
    ALTER TABLE IF EXISTS specialization_features
      ADD COLUMN IF NOT EXISTS start_line smallint,
      ADD COLUMN IF NOT EXISTS end_line   smallint
  `);

  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
      ADD COLUMN IF NOT EXISTS start_line smallint,
      ADD COLUMN IF NOT EXISTS end_line   smallint
  `);
}

/**
 * Reverts migration 013: drops the `start_line` and `end_line` columns from all
 * three affected tables.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS vocation_features
      DROP COLUMN IF EXISTS start_line,
      DROP COLUMN IF EXISTS end_line
  `);

  await client.query(`
    ALTER TABLE IF EXISTS specialization_features
      DROP COLUMN IF EXISTS start_line,
      DROP COLUMN IF EXISTS end_line
  `);

  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
      DROP COLUMN IF EXISTS start_line,
      DROP COLUMN IF EXISTS end_line
  `);
}
