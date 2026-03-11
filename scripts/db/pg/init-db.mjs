/**
 * @fileoverview PostgreSQL Database Initialisation Script
 * @description Creates all content and auth tables via raw DDL, then applies
 * supplementary indexes (expression-based COALESCE unique index, GIN indexes
 * on array columns).
 *
 * Safe to run multiple times — all statements use IF NOT EXISTS.
 *
 * Usage:
 *   node scripts/db/pg/init-db.mjs
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { createLogger } from '../../core/logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../');
const log = createLogger({ script: 'init-db' });

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local absent — rely on system env */
}

if (!process.env.DATABASE_URL) {
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

/* ──────────────────────  Table DDL  ───────────────────────────────── */

/**
 * DDL statements for all tables managed by this project.
 *
 * @type {string[]}
 */
const TABLE_DDL = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     name       text        PRIMARY KEY,
     applied_at timestamptz NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS corrections_users (
     id             text        PRIMARY KEY,
     username       text        NOT NULL UNIQUE,
     password_hash  text        NOT NULL,
     role           text        NOT NULL DEFAULT 'editor',
     created_at     timestamptz NOT NULL DEFAULT now(),
     last_login_at  timestamptz
   )`,

  `CREATE TABLE IF NOT EXISTS monsters (
     id                     serial       PRIMARY KEY,
     locale                 text         NOT NULL,
     slug                   text         NOT NULL,
     sub_slug               text,
     title                  text         NOT NULL,
     file                   text         NOT NULL,
     link                   text         NOT NULL,
     size                   text,
     creature_type          text,
     alignment              text,
     cr                     text,
     proficiency_bonus      smallint,
     ac_value               smallint,
     ac_notes               text,
     ac_raw                 text,
     hp_average             smallint,
     hp_formula             text,
     hp_raw                 text,
     speed_raw              text,
     speed_walk             smallint,
     speed_fly              smallint,
     speed_climb            smallint,
     speed_swim             smallint,
     speed_burrow           smallint,
     speed_hover            boolean,
     score_str              smallint,
     score_dex              smallint,
     score_con              smallint,
     score_int              smallint,
     score_wis              smallint,
     score_cha              smallint,
     save_str               smallint,
     save_dex               smallint,
     save_con               smallint,
     save_int               smallint,
     save_wis               smallint,
     save_cha               smallint,
     sense_raw              text,
     sense_passive_perception smallint,
     sense_darkvision       smallint,
     sense_blindsight       smallint,
     sense_tremorsense      smallint,
     sense_truesight        smallint,
     skills                 text[]       NOT NULL DEFAULT '{}',
     damage_resistances     text[]       NOT NULL DEFAULT '{}',
     damage_immunities      text[]       NOT NULL DEFAULT '{}',
     damage_vulnerabilities text[]       NOT NULL DEFAULT '{}',
     condition_immunities   text[]       NOT NULL DEFAULT '{}',
     languages              text[]       NOT NULL DEFAULT '{}',
     tags                   text[]       NOT NULL DEFAULT '{}',
     index_version          smallint,
     UNIQUE (locale, slug, sub_slug)
   )`,

  `CREATE TABLE IF NOT EXISTS heirlooms (
     id                       serial    PRIMARY KEY,
     locale                   text      NOT NULL,
     slug                     text      NOT NULL,
     title                    text      NOT NULL,
     file                     text      NOT NULL,
     link                     text      NOT NULL,
     rarity                   text,
     item_type                text,
     weapon_type              text,
     requires_attunement      boolean,
     attunement_requirements  text,
     weapon_damage            text,
     weapon_damage_type       text,
     versatile_damage         text,
     hit_modifier             smallint,
     range                    text,
     weight                   text,
     charges_initial          smallint,
     charges_recharge         text,
     charges_depletes         boolean,
     mastery                  text[]    NOT NULL DEFAULT '{}',
     weapon_properties        text[]    NOT NULL DEFAULT '{}',
     damage_types_dealt       text[]    NOT NULL DEFAULT '{}',
     saving_throw_types       text[]    NOT NULL DEFAULT '{}',
     tags                     text[]    NOT NULL DEFAULT '{}',
     index_version            smallint,
     UNIQUE (locale, slug)
   )`,

  `CREATE TABLE IF NOT EXISTS spells (
     id                    serial    PRIMARY KEY,
     locale                text      NOT NULL,
     slug                  text      NOT NULL,
     title                 text      NOT NULL,
     file                  text      NOT NULL,
     link                  text      NOT NULL,
     level                 smallint,
     school                text,
     quality               text,
     casting_time_raw      text,
     casting_time          text[]    NOT NULL DEFAULT '{}',
     range                 text,
     concentration         boolean,
     duration              text,
     component_verbal      boolean,
     component_somatic     boolean,
     component_material    boolean,
     component_material_description text,
     has_ritual            boolean,
     tags                  text[]    NOT NULL DEFAULT '{}',
     UNIQUE (locale, slug)
   )`,

  `CREATE TABLE IF NOT EXISTS spell_lists (
     id       serial  PRIMARY KEY,
     spell_id integer NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
     name     text    NOT NULL,
     link     text    NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS trinkets (
     id                    serial    PRIMARY KEY,
     locale                text      NOT NULL,
     slug                  text      NOT NULL,
     title                 text      NOT NULL,
     file                  text      NOT NULL,
     link                  text      NOT NULL,
     item_type             text      NOT NULL,
     damage                text,
     damage_type           text,
     range                 text,
     weight                text,
     saving_throw_dc       smallint,
     saving_throw_ability  text,
     properties            text[]    NOT NULL DEFAULT '{}',
     special_effects       text[]    NOT NULL DEFAULT '{}',
     inflicts_conditions   text[]    NOT NULL DEFAULT '{}',
     tags                  text[]    NOT NULL DEFAULT '{}',
     UNIQUE (locale, slug)
   )`,
];

/* ───────────────────  Supplementary Indexes  ─────────────────────── */

/**
 * Expression-based and GIN indexes that supplement the table definitions.
 *
 * @type {string[]}
 */
const SUPPLEMENTARY_INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS monsters_locale_display_slug_uidx
     ON monsters (locale, COALESCE(sub_slug, slug))`,
  `CREATE INDEX IF NOT EXISTS monsters_locale_slug_idx
     ON monsters (locale, slug)`,
  `CREATE INDEX IF NOT EXISTS monsters_locale_cr_idx
     ON monsters (locale, cr)`,
  `CREATE INDEX IF NOT EXISTS monsters_tags_gin_idx
     ON monsters USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS heirlooms_locale_rarity_idx
     ON heirlooms (locale, rarity)`,
  `CREATE INDEX IF NOT EXISTS heirlooms_tags_gin_idx
     ON heirlooms USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS spells_locale_level_idx
     ON spells (locale, level)`,
  `CREATE INDEX IF NOT EXISTS spells_locale_school_idx
     ON spells (locale, school)`,
  `CREATE INDEX IF NOT EXISTS spells_tags_gin_idx
     ON spells USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS spell_lists_spell_id_idx
     ON spell_lists (spell_id)`,
  `CREATE INDEX IF NOT EXISTS trinkets_locale_item_type_idx
     ON trinkets (locale, item_type)`,
  `CREATE INDEX IF NOT EXISTS trinkets_tags_gin_idx
     ON trinkets USING GIN (tags)`,
];

/* ─────────────────────────  Main  ─────────────────────────────────── */

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10_000,
  });

  try {
    log.message('🔄  Creating tables…');
    for (const ddl of TABLE_DDL) {
      await pool.query(ddl);
    }
    log.message('✅  All tables created (or already existed).');

    log.message('🔄  Creating supplementary indexes…');
    for (const ddl of SUPPLEMENTARY_INDEXES) {
      await pool.query(ddl);
    }
    log.message('✅  Supplementary indexes created (or already existed).');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  log.error('❌  init-db failed:', err.message);
  process.exit(1);
});
