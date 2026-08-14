/**
 * @fileoverview Migration 018 — Add sub_options to bloodline_boons
 * @description Adds a nullable `sub_options` JSONB column to the `bloodline_boons`
 * table. Stored via `information_schema.columns` check, so re-runs are safe.
 * After applying, run `npm run db:seed` to backfill sub-options.
 *
 * @module scripts/db/migrations/018_add_sub_options_to_bloodline_boons
 * @author Typeir
 * @version 1.0.0
 * @since 11.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Whether a column exists on a table in the public schema.
 *
 * @param {PoolClient} client - Transactional pg client
 * @param {string} table - Table name
 * @param {string} column - Column name
 * @returns {Promise<boolean>} True when the column exists
 */
async function columnExists(
  client: PoolClient,
  table: string,
  column: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Applies migration 018: adds the nullable `bloodline_boons.sub_options` JSONB
 * column when it is not already present.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  if (await columnExists(client, 'bloodline_boons', 'sub_options')) {
    return;
  }
  await client.query(
    `ALTER TABLE bloodline_boons ADD COLUMN sub_options jsonb`,
  );
}

/**
 * Reverts migration 018: drops `bloodline_boons.sub_options` when present.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  if (!(await columnExists(client, 'bloodline_boons', 'sub_options'))) {
    return;
  }
  await client.query(`ALTER TABLE bloodline_boons DROP COLUMN sub_options`);
}
