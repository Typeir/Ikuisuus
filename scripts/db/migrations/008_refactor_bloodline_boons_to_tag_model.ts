/**
 * @fileoverview Migration 008 — Refactor bloodline boons to tag model
 * @description Replaces prose-heavy boon storage (`body`, `notes`) with a
 * normalized `tags` array for query-oriented metadata.
 *
 * Existing rows are best-effort backfilled with coarse tags derived from the
 * legacy prose columns before those columns are dropped.
 *
 * @module scripts/db/migrations/008_refactor_bloodline_boons_to_tag_model
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 008.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
    ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'
  `);

  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bloodline_boons'
          AND column_name = 'body'
      ) THEN
        UPDATE bloodline_boons
        SET tags = (
          SELECT COALESCE(array_agg(DISTINCT t.tag), '{}')
          FROM unnest(
            ARRAY[
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bshort rest\\b' THEN 'mechanic:short-rest-recharge' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\blong rest\\b' THEN 'mechanic:long-rest-recharge' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bsaving throw\\b|\\bsave dc\\b' THEN 'mechanic:saving-throw' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bac\\b|\\barmor class\\b|\\bunarmored\\b' THEN 'mechanic:ac' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bweapon\\b|\\bmelee\\b|\\bnatural weapon\\b' THEN 'mechanic:weapon' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bproficien' THEN 'mechanic:proficiency' END,
              CASE WHEN lower(coalesce(body, '') || ' ' || coalesce(notes, '')) ~ '\\bextra\\b.{0,30}\\bdamage\\b|\\bdeal extra\\b' THEN 'mechanic:extra-damage' END
            ]
          ) AS t(tag)
          WHERE t.tag IS NOT NULL
        )
        WHERE COALESCE(array_length(tags, 1), 0) = 0;
      END IF;
    END $$;
  `);

  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
    DROP COLUMN IF EXISTS body,
    DROP COLUMN IF EXISTS notes
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodline_boons_tags_gin_idx
    ON bloodline_boons USING GIN (tags)
  `);
}

/**
 * Reverts migration 008.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`
    DROP INDEX IF EXISTS bloodline_boons_tags_gin_idx
  `);

  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
    ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS notes text
  `);

  await client.query(`
    ALTER TABLE IF EXISTS bloodline_boons
    DROP COLUMN IF EXISTS tags
  `);
}
