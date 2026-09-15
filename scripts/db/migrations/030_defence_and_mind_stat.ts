/**
 * @fileoverview Migration 030 — Defence replaces AC, the mind stat replaces Intelligence
 * @description Renames the `monsters.ac_*` columns to `defence_*` and adds the
 * Deflect and Dodge columns; drops the Intelligence score and save columns;
 * renames the passive Perception column to passive Descry and adds passive
 * Discern.
 *
 * @module scripts/db/migrations/030_defence_and_mind_stat
 * @author Typeir
 * @version 1.0.0
 * @since 2026-09-16
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
 * Renames a column when the old name exists and the new one does not.
 *
 * @param {PoolClient} client - Transactional pg client
 * @param {string} from - Current column name
 * @param {string} to - Wanted column name
 * @returns {Promise<void>}
 */
async function rename(client: PoolClient, from: string, to: string): Promise<void> {
  const hasOld = await columnExists(client, 'monsters', from);
  const hasNew = await columnExists(client, 'monsters', to);
  if (hasOld && !hasNew) {
    await client.query(`ALTER TABLE monsters RENAME COLUMN ${from} TO ${to}`);
  }
}

/**
 * Applies migration 030
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await rename(client, 'ac_value', 'defence_value');
  await rename(client, 'ac_notes', 'defence_notes');
  await rename(client, 'ac_raw', 'defence_raw');
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS defence_deflect text`);
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS defence_dodge text`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS score_int`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS save_int`);
  await rename(client, 'sense_passive_perception', 'sense_passive_descry');
  await client.query(
    `ALTER TABLE monsters ADD COLUMN IF NOT EXISTS sense_passive_discern smallint`,
  );
}

/**
 * Reverts migration 030
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS sense_passive_discern`);
  await rename(client, 'sense_passive_descry', 'sense_passive_perception');
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS save_int smallint`);
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS score_int smallint`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS defence_dodge`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS defence_deflect`);
  await rename(client, 'defence_raw', 'ac_raw');
  await rename(client, 'defence_notes', 'ac_notes');
  await rename(client, 'defence_value', 'ac_value');
}
