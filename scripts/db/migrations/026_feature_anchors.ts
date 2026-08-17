/**
 * @fileoverview Migration 026 — Feature anchors, boon options table
 * @description Every feature shard table gains `anchor`: the slug of the
 * rendered heading (shared `anchorSlug` rule), the stable key character
 * shards and the content-shards API resolve by. Boon options move out of the
 * `bloodline_boons.sub_options` JSONB (018) into a `bloodline_boon_options`
 * child table, and `world.knowledge_tiers` becomes `text[]`; JSONB columns
 * are not allowed in this schema.
 *
 * After applying, run `npx tsx scripts/db/pg/seed-from-fs.ts` to backfill.
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
 * Applies migration 026.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
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
  /* 023 shipped `knowledge_tiers` as jsonb on databases migrated before this
     fix; converge on text[]. */
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
 * Reverts migration 026.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
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
