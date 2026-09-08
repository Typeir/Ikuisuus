/**
 * @fileoverview Migration 021 — Add specialization ownership to spell lists
 * @description Adds a nullable `specialization text` column to `spell_lists`,
 * matching `SpellListEntity.specialization`.
 *
 * @module scripts/db/migrations/021_add_specialization_to_spell_lists
 * @author Typeir
 * @version 1.0.0
 * @since 10.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 021
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS spell_lists
      ADD COLUMN IF NOT EXISTS specialization text
  `);

  await client.query(`
    UPDATE spell_lists
       SET specialization = substring(link from '([^/]+)[.]specialization$')
     WHERE specialization IS NULL
       AND link LIKE '%.specialization'
  `);
}

/**
 * Reverts migration 021
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS spell_lists
      DROP COLUMN IF EXISTS specialization
  `);
}
