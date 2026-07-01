/**
 * @fileoverview Migration 016 — Rename tier_bonus → tier_bonus
 * @description Renames the `tier_bonus` column in the `monsters` table
 * to `tier_bonus`, aligning the database schema with the tier bonus terminology
 * change. The companion entity (`MonsterEntity`) and all application-layer
 * references are updated separately.
 *
 * After applying, run `npm run db:seed` to refresh content from regenerated
 * `.metadata.json` sidecars.
 *
 * @module scripts/db/migrations/016_rename_proficiency_bonus_to_tier_bonus
 * @author Typeir
 * @version 1.0.0
 * @since 10.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 016: renames `monsters.tier_bonus` to `tier_bonus`.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(
    `ALTER TABLE monsters RENAME COLUMN tier_bonus TO tier_bonus`,
  );
}

/**
 * Reverts migration 016: renames `monsters.tier_bonus` back to `tier_bonus`.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(
    `ALTER TABLE monsters RENAME COLUMN tier_bonus TO tier_bonus`,
  );
}
