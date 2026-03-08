/**
 * @fileoverview Database Initialisation Script
 * @description Creates all Postgres tables for the Neon/Postgres backend.
 * Safe to run multiple times — all DDL uses IF NOT EXISTS.
 *
 * Tables created:
 *   - corrections_users   (auth)
 *   - monsters            (one row per stat block, sub_slug handles multi-block files)
 *   - heirlooms
 *   - spells
 *   - spell_lists         (normalised SpellListRef rows, FK → spells.id)
 *   - trinkets
 *
 * Usage:
 *   node scripts/db/init-db.mjs
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency needed in scripts folder)
// ---------------------------------------------------------------------------
try {
  const envPath = resolve(__dirname, '../../.env.local');
  const raw = readFileSync(envPath, 'utf8');
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
  // .env.local absent — rely on system env
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 1 });

// ---------------------------------------------------------------------------
// DDL
// ---------------------------------------------------------------------------

const DDL = /* sql */ `

/* ═══════════════════════════════════════════════════════ AUTH ══════════ */

CREATE TABLE IF NOT EXISTS corrections_users (
  id            TEXT        PRIMARY KEY,
  username      TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'editor',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

/* ══════════════════════════════════════════════════════ MONSTERS ════════ */

CREATE TABLE IF NOT EXISTS monsters (
  id                     SERIAL      PRIMARY KEY,
  locale                 TEXT        NOT NULL,
  slug                   TEXT        NOT NULL,
  -- sub_slug is set when one source file contains multiple stat blocks.
  -- It becomes the canonical lookup slug; slug identifies the source file.
  sub_slug               TEXT,
  title                  TEXT        NOT NULL,
  file                   TEXT        NOT NULL,
  link                   TEXT        NOT NULL,

  -- Core descriptor
  size                   TEXT,
  creature_type          TEXT,
  alignment              TEXT,
  cr                     TEXT,
  proficiency_bonus      SMALLINT,

  -- Armor Class
  ac_value               SMALLINT,
  ac_notes               TEXT,
  ac_raw                 TEXT,

  -- Hit Points
  hp_average             SMALLINT,
  hp_formula             TEXT,
  hp_raw                 TEXT,

  -- Speed (values in feet; hover is a boolean flag)
  speed_raw              TEXT,
  speed_walk             SMALLINT,
  speed_fly              SMALLINT,
  speed_climb            SMALLINT,
  speed_swim             SMALLINT,
  speed_burrow           SMALLINT,
  speed_land             SMALLINT,
  speed_hover            BOOLEAN,

  -- Ability Scores
  str_score              SMALLINT,
  str_mod                SMALLINT,
  dex_score              SMALLINT,
  dex_mod                SMALLINT,
  con_score              SMALLINT,
  con_mod                SMALLINT,
  int_score              SMALLINT,
  int_mod                SMALLINT,
  wis_score              SMALLINT,
  wis_mod                SMALLINT,
  cha_score              SMALLINT,
  cha_mod                SMALLINT,

  -- Saving Throws (bonus values)
  save_str               SMALLINT,
  save_dex               SMALLINT,
  save_con               SMALLINT,
  save_int               SMALLINT,
  save_wis               SMALLINT,
  save_cha               SMALLINT,

  -- Senses
  senses_raw             TEXT,
  passive_perception     SMALLINT,
  darkvision             SMALLINT,
  blindsight             SMALLINT,
  tremorsense            SMALLINT,
  truesight              SMALLINT,

  -- Native arrays
  skills                 TEXT[],
  damage_resistances     TEXT[],
  damage_immunities      TEXT[],
  damage_vulnerabilities TEXT[],
  condition_immunities   TEXT[],
  languages              TEXT[],
  tags                   TEXT[],

  index_version          SMALLINT
);

-- For multi-stat-block files sub_slug is the canonical key; for single-block
-- files slug alone is enough. COALESCE collapses both cases into one unique key.
CREATE UNIQUE INDEX IF NOT EXISTS monsters_locale_display_slug_uidx
  ON monsters (locale, COALESCE(sub_slug, slug));

CREATE INDEX IF NOT EXISTS monsters_locale_slug_idx   ON monsters (locale, slug);
CREATE INDEX IF NOT EXISTS monsters_locale_cr_idx     ON monsters (locale, cr);
CREATE INDEX IF NOT EXISTS monsters_locale_type_idx   ON monsters (locale, creature_type);
CREATE INDEX IF NOT EXISTS monsters_tags_gin_idx      ON monsters USING GIN (tags);

/* ══════════════════════════════════════════════════════ HEIRLOOMS ═══════ */

CREATE TABLE IF NOT EXISTS heirlooms (
  id                      SERIAL  PRIMARY KEY,
  locale                  TEXT    NOT NULL,
  slug                    TEXT    NOT NULL,
  title                   TEXT    NOT NULL,
  file                    TEXT    NOT NULL,
  link                    TEXT    NOT NULL,

  rarity                  TEXT,
  item_type               TEXT,
  weapon_type             TEXT,
  requires_attunement     BOOLEAN,
  attunement_requirements TEXT,

  -- Weapon damage (flattened from HeirloomWeaponDamage)
  weapon_damage           TEXT,
  weapon_damage_type      TEXT,
  versatile_damage        TEXT,

  hit_modifier            SMALLINT,
  range                   TEXT,
  weight                  TEXT,
  charges_initial         TEXT,
  charges_recharge        TEXT,
  charges_depletes        BOOLEAN,

  -- Native arrays
  mastery                 TEXT[],
  weapon_properties       TEXT[],
  damage_types_dealt      TEXT[],
  saving_throw_types      TEXT[],
  tags                    TEXT[],

  index_version           SMALLINT,

  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS heirlooms_locale_rarity_idx    ON heirlooms (locale, rarity);
CREATE INDEX IF NOT EXISTS heirlooms_locale_item_type_idx ON heirlooms (locale, item_type);
CREATE INDEX IF NOT EXISTS heirlooms_tags_gin_idx         ON heirlooms USING GIN (tags);

/* ════════════════════════════════════════════════════════ SPELLS ════════ */

CREATE TABLE IF NOT EXISTS spells (
  id                   SERIAL   PRIMARY KEY,
  locale               TEXT     NOT NULL,
  slug                 TEXT     NOT NULL,
  title                TEXT     NOT NULL,
  file                 TEXT     NOT NULL,
  link                 TEXT     NOT NULL,

  level                SMALLINT,
  school               TEXT,
  quality              TEXT,
  casting_time_raw     TEXT,
  range                TEXT,
  concentration        BOOLEAN,
  duration             TEXT,
  verbal               BOOLEAN,
  somatic              BOOLEAN,
  material             BOOLEAN,
  material_description TEXT,
  has_ritual           BOOLEAN,

  -- Native arrays
  casting_time         TEXT[],
  tags                 TEXT[],

  UNIQUE (locale, slug)
);

-- Normalised spell-list memberships (replaces SpellListRef[] on the parent)
CREATE TABLE IF NOT EXISTS spell_lists (
  id       SERIAL PRIMARY KEY,
  spell_id INT    NOT NULL REFERENCES spells (id) ON DELETE CASCADE,
  name     TEXT   NOT NULL,
  link     TEXT   NOT NULL
);

CREATE INDEX IF NOT EXISTS spell_lists_spell_id_idx ON spell_lists (spell_id);
CREATE INDEX IF NOT EXISTS spells_locale_level_idx  ON spells (locale, level);
CREATE INDEX IF NOT EXISTS spells_locale_school_idx ON spells (locale, school);
CREATE INDEX IF NOT EXISTS spells_tags_gin_idx      ON spells USING GIN (tags);

/* ══════════════════════════════════════════════════════ TRINKETS ════════ */

CREATE TABLE IF NOT EXISTS trinkets (
  id                   SERIAL  PRIMARY KEY,
  locale               TEXT    NOT NULL,
  slug                 TEXT    NOT NULL,
  title                TEXT    NOT NULL,
  file                 TEXT    NOT NULL,
  link                 TEXT    NOT NULL,

  item_type            TEXT    NOT NULL,
  damage               TEXT,
  damage_type          TEXT,
  range                TEXT,
  weight               TEXT,
  saving_throw_dc      SMALLINT,
  saving_throw_ability TEXT,

  -- Native arrays
  properties           TEXT[],
  special_effects      TEXT[],
  inflicts_conditions  TEXT[],
  tags                 TEXT[],

  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS trinkets_locale_item_type_idx ON trinkets (locale, item_type);
CREATE INDEX IF NOT EXISTS trinkets_tags_gin_idx         ON trinkets USING GIN (tags);

`;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔌  Connected to Postgres.');
    await client.query(DDL);
    console.log('✅  All tables and indexes created (or already existed).');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌  Init failed:', err.message);
  process.exit(1);
});
