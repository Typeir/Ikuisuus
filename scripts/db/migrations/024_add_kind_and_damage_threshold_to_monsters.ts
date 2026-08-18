/**
 * @fileoverview Migration 024: add kind and damage_threshold to monsters.
 * @description Object statlets get kind='object' and damage threshold; creatures keep kind=null.
 *
 * @module scripts/db/migrations/024_add_kind_and_damage_threshold_to_monsters
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Add kind and damage_threshold columns.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS kind text`);
  await client.query(
    `ALTER TABLE monsters ADD COLUMN IF NOT EXISTS damage_threshold smallint`,
  );
}

/**
 * Drop kind and damage_threshold columns.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS damage_threshold`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS kind`);
}
