/**
 * @fileoverview Migration 026: add anchors to features; move boon options to child table.
 * @description Anchors are heading slugs shared with shards; knowledge_tiers converged to text[].
 *
 * @module scripts/db/migrations/026_feature_anchors
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

const TABLES = [
  'bloodline_boons',
  'bloodline_features',
  'feat_features',
  'monster_features',
  'specialization_features',
  'vocation_features',
] as const;

/**
 * Add anchor columns; create bloodline_boon_options table.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  for (const table of TABLES) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS anchor text`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS ${table}_anchor_idx ON ${table} (anchor)`,
    );
  }
  await client.query(`
    CREATE TABLE IF NOT EXISTS bloodline_boon_options (
      id          serial   PRIMARY KEY,
      boon_id     integer  NOT NULL REFERENCES bloodline_boons(id) ON DELETE CASCADE,
      name        text     NOT NULL,
      anchor      text,
      bp_value    smallint NOT NULL DEFAULT 0,
      effect      text,
      tags        text[]   NOT NULL DEFAULT '{}',
      sort_order  smallint NOT NULL DEFAULT 0
    )
  `);
  await client.query(
    `CREATE INDEX IF NOT EXISTS bloodline_boon_options_boon_id_idx ON bloodline_boon_options (boon_id)`,
  );
  await client.query(`ALTER TABLE bloodline_boons DROP COLUMN IF EXISTS sub_options`);
  /* Converge knowledge_tiers to text[] (023 shipped as jsonb on some dbs). */
  const { rows } = await client.query<{ data_type: string }>(
    `SELECT data_type FROM information_schema.columns
     WHERE table_name = 'world' AND column_name = 'knowledge_tiers'`,
  );
  if (rows[0]?.data_type === 'jsonb') {
    await client.query(`
      ALTER TABLE world
        ALTER COLUMN knowledge_tiers DROP DEFAULT,
        ALTER COLUMN knowledge_tiers TYPE text[]
          USING COALESCE(ARRAY(SELECT jsonb_array_elements_text(knowledge_tiers)), '{}'),
        ALTER COLUMN knowledge_tiers SET DEFAULT '{}',
        ALTER COLUMN knowledge_tiers SET NOT NULL
    `);
  }
}

/**
 * Drop anchor columns and bloodline_boon_options table.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS bloodline_boon_options`);
  await client.query(`ALTER TABLE bloodline_boons ADD COLUMN IF NOT EXISTS sub_options jsonb`);
  for (const table of TABLES) {
    await client.query(`DROP INDEX IF EXISTS ${table}_anchor_idx`);
    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS anchor`);
  }
}
