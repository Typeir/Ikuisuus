/**
 * @fileoverview Migration 024 — Add kind and damage_threshold to monsters
 * @description Quoted object statlets (plating, blades, drones) now emit
 * their own monster records with `kind = 'object'` and a damage threshold in
 * place of ability scores. Creatures keep `kind` null.
 *
 * @module scripts/db/migrations/024_add_kind_and_damage_threshold_to_monsters
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 024.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters ADD COLUMN IF NOT EXISTS kind text`);
  await client.query(
    `ALTER TABLE monsters ADD COLUMN IF NOT EXISTS damage_threshold smallint`,
  );
}

/**
 * Reverts migration 024.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS damage_threshold`);
  await client.query(`ALTER TABLE monsters DROP COLUMN IF EXISTS kind`);
}
