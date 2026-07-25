/**
 * @fileoverview Migration 019 — Add proficiency grant tags to features and feats
 * @description Adds a nullable `grants text[]` column to `vocation_features`,
 * `specialization_features`, and `feats`. The column stores the tag-based
 * proficiency grants (`skill:arcana:expertise`, `armor:heavy`,
 * `saving_throw:wisdom`, `weapon:martial`, …) previously served only by the
 * filesystem backend, bringing the PostgreSQL backend to parity so the
 * character-builder auto-applies granted proficiencies identically in both
 * modes. Nullable because most rows grant nothing; the metadata generator emits
 * `grants` only when non-empty, so the seed leaves absent rows NULL.
 *
 * After applying, re-seed with `npx tsx scripts/db/pg/seed-from-fs.ts` so the
 * `grants` values from the `.metadata.json` sidecars populate the new column.
 *
 * @module scripts/db/migrations/019_add_grants_to_features_and_feats
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 019: adds the `grants` array column to the two feature
 * child tables and the `feats` parent table.
 *
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
 * Reverts migration 019: drops the `grants` column from all three tables.
 *
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
