/**
 * @fileoverview Migration 023: creates rules and world tables.
 * @description Columns match metadata sidecar records from generators.
 *
 * @module scripts/db/migrations/023_create_rules_and_world_tables
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Create rules and world tables with (locale, slug) unique constraints.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS rules (
      id            serial  PRIMARY KEY,
      locale        text    NOT NULL,
      slug          text    NOT NULL,
      title         text    NOT NULL,
      file          text    NOT NULL,
      link          text    NOT NULL,
      category      text,
      tags          text[]  NOT NULL DEFAULT '{}',
      description   text,
      image         text,
      reading_time  text,
      version_hash  text,
      UNIQUE (locale, slug)
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS rules_locale_category_idx
      ON rules(locale, category)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS world (
      id               serial  PRIMARY KEY,
      locale           text    NOT NULL,
      slug             text    NOT NULL,
      title            text    NOT NULL,
      file             text    NOT NULL,
      link             text    NOT NULL,
      category         text,
      tags             text[]  NOT NULL DEFAULT '{}',
      aliases          text[]  NOT NULL DEFAULT '{}',
      related_slugs    text[]  NOT NULL DEFAULT '{}',
      knowledge_tiers  text[]  NOT NULL DEFAULT '{}',
      description      text,
      image            text,
      reading_time     text,
      version_hash     text,
      UNIQUE (locale, slug)
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS world_locale_category_idx
      ON world(locale, category)
  `);
}

/**
 * Drop rules and world tables.
 *
 * @param {PoolClient} client - Transactional pg client.
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP TABLE IF EXISTS world`);
  await client.query(`DROP TABLE IF EXISTS rules`);
}
