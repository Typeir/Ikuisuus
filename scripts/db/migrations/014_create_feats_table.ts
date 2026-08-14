/**
 * @fileoverview Migration 014 — Create feats table
 * @description Creates the `feats` parent table storing feat metadata from
 * `src/content/{locale}/character-creation/feats/*.mdx`,
 * plus locale and tags indexes.
 *
 * @module scripts/db/migrations/014_create_feats_table
 * @author Typeir
 * @version 1.0.0
 * @since 9.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 014: creates the `feats` table and its indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS feats (
      id                              serial    PRIMARY KEY,
      locale                          text      NOT NULL,
      slug                            text      NOT NULL,
      title                           text      NOT NULL,
      file                            text      NOT NULL,
      link                            text      NOT NULL,
      description                     text,
      prerequisite                    text,
      has_prerequisite                boolean   NOT NULL DEFAULT false,
      ability_increase_abilities      text[],
      ability_increase_amount         smallint,
      ability_increase_maximum        smallint,
      tags                            text[]    NOT NULL DEFAULT '{}',
      index_version                   smallint,
      version_hash                    text,
      UNIQUE (locale, slug)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS feats_locale_idx
      ON feats (locale)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS feats_tags_gin_idx
      ON feats USING GIN (tags)
  `);
}

/**
 * Reverts migration 014: drops the `feats` table and its indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP INDEX IF EXISTS feats_tags_gin_idx`);
  await client.query(`DROP INDEX IF EXISTS feats_locale_idx`);
  await client.query(`DROP TABLE IF EXISTS feats`);
}
