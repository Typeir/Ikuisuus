/**
 * @fileoverview Migration 031
 * @description Monsters get Poise and Stability, both stored as written.
 *
 * @module scripts/db/migrations/031_add_poise_and_stability_to_monsters
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Add poise and stability columns.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS poise text`);
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS stability text`);
}

/**
 * Drop poise and stability columns.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS stability`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS poise`);
}
