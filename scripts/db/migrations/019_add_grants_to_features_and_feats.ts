/**
 * @fileoverview Migration 019 — add proficiency grant tags to features and feats
 * @description Adds a nullable `grants text[]` column to `vocation_features`,
 * `specialization_features`, and `feats`. Stores tag-based proficiency grants
 * (`skill:arcana:expertise`, `armor:heavy`, `saving_throw:wisdom`,
 * `weapon:martial`, …). NULL when a row grants nothing.
 * @module scripts/db/migrations/019_add_grants_to_features_and_feats
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Adds the nullable `grants text[]` column to all three tables.
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS vocation_features
      ADD COLUMN IF NOT EXISTS grants text[]
  `);

  await client.query(`
    ALTER TABLE IF EXISTS specialization_features
      ADD COLUMN IF NOT EXISTS grants text[]
  `);

  await client.query(`
    ALTER TABLE IF EXISTS feats
      ADD COLUMN IF NOT EXISTS grants text[]
  `);
}

/**
 * Drops the `grants` column from all three tables.
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS vocation_features
      DROP COLUMN IF EXISTS grants
  `);

  await client.query(`
    ALTER TABLE IF EXISTS specialization_features
      DROP COLUMN IF EXISTS grants
  `);

  await client.query(`
    ALTER TABLE IF EXISTS feats
      DROP COLUMN IF EXISTS grants
  `);
}
