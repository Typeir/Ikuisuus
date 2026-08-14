/**
 * @fileoverview Migration 016 — Rename proficiency_bonus → tier_bonus
 * @description Renames `monsters.proficiency_bonus` to `tier_bonus`.
 * Idempotent: skipped when the old column is absent or the new column exists.
 * Run `npm run db:seed` after to refresh `.metadata.json` sidecars.
 *
 * @module scripts/db/migrations/016_rename_proficiency_bonus_to_tier_bonus
 * @author Typeir
 * @version 1.1.0
 * @since 10.0.0
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
 * Applies migration 016: renames `monsters.proficiency_bonus` to
 * `tier_bonus` when the old column is still present.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  const hasOld = await columnExists(client, 'monsters', 'proficiency_bonus');
  const hasNew = await columnExists(client, 'monsters', 'tier_bonus');
  if (hasOld && !hasNew) {
    await client.query(
      `ALTER TABLE monsters RENAME COLUMN proficiency_bonus TO tier_bonus`,
    );
  }
}

/**
 * Reverts migration 016: renames `monsters.tier_bonus` back to
 * `proficiency_bonus` when present.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  const hasNew = await columnExists(client, 'monsters', 'tier_bonus');
  const hasOld = await columnExists(client, 'monsters', 'proficiency_bonus');
  if (hasNew && !hasOld) {
    await client.query(
      `ALTER TABLE monsters RENAME COLUMN tier_bonus TO proficiency_bonus`,
    );
  }
}
