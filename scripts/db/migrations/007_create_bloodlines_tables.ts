/**
 * @fileoverview Migration 007 — Create bloodlines + bloodline_boons tables
 * @description Fully typed schema for bloodline metadata. Core features are stored
 * as explicit typed columns (text arrays for multi-value fields). Boons are stored
 * in a normalised child table with a foreign key to the parent bloodline row.
 *
 * No JSONB payload columns — every field has a dedicated column and type.
 *
 * @module scripts/db/migrations/007_create_bloodlines_tables
 */

import type { PoolClient } from 'pg';

/**
 * Applies the migration: creates `bloodlines` and `bloodline_boons` tables
 * with all supporting indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS bloodlines (
      id                serial    PRIMARY KEY,
      locale            text      NOT NULL,
      slug              text      NOT NULL,
      title             text      NOT NULL,
      file              text      NOT NULL,
      link              text      NOT NULL,
      description       text,
      ability_scores    text[]    NOT NULL DEFAULT '{}',
      movement_speeds   text[]    NOT NULL DEFAULT '{}',
      senses            text[]    NOT NULL DEFAULT '{}',
      size              text[]    NOT NULL DEFAULT '{}',
      creature_types    text[]    NOT NULL DEFAULT '{}',
      age               text,
      boon_budget       smallint,
      tags              text[]    NOT NULL DEFAULT '{}',
      index_version     smallint,
      version_hash      text,
      UNIQUE (locale, slug)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS bloodline_boons (
      id              serial    PRIMARY KEY,
      bloodline_id    integer   NOT NULL REFERENCES bloodlines(id) ON DELETE CASCADE,
      name            text      NOT NULL,
      bp_label        text      NOT NULL,
      bp_value        smallint,
      sort_order      smallint  NOT NULL DEFAULT 0,
      body            text      NOT NULL,
      notes           text
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodlines_locale_idx
      ON bloodlines (locale)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodlines_tags_gin_idx
      ON bloodlines USING GIN (tags)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodline_boons_bloodline_id_idx
      ON bloodline_boons (bloodline_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS bloodline_boons_sort_order_idx
      ON bloodline_boons (bloodline_id, sort_order)
  `);
}

/**
 * Reverses the migration: drops child table and indexes first, then parent.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP INDEX IF EXISTS bloodline_boons_sort_order_idx`);
  await client.query(`DROP INDEX IF EXISTS bloodline_boons_bloodline_id_idx`);
  await client.query(`DROP TABLE IF EXISTS bloodline_boons`);

  await client.query(`DROP INDEX IF EXISTS bloodlines_tags_gin_idx`);
  await client.query(`DROP INDEX IF EXISTS bloodlines_locale_idx`);
  await client.query(`DROP TABLE IF EXISTS bloodlines`);
}
