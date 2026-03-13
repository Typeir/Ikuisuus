-- Migration: 003_embeddable_column_renames
-- Date: 2026-03-10
-- Renames columns to use consistent prefixes so MikroORM @Embedded with
-- `prefix` can map flat DB columns to value-object classes automatically.
--
-- Groups affected:
--   monsters.score_*  — ability scores (was *_score)
--   monsters.sense_*  — senses (was unprefixed / senses_raw)
--   spells.component_* — spell components (was unprefixed verbal/somatic/etc.)
--
-- Saves (save_*) and trinket saving throws (saving_throw_*) already have
-- correct prefixes and need no rename.
--
-- Also fixes column type mismatches where DDL had `text` but entity used
-- smallint/boolean (speed modes, senses).

-- ── Monster ability scores: *_score → score_* ──────────────────────────
ALTER TABLE monsters RENAME COLUMN str_score TO score_str;
ALTER TABLE monsters RENAME COLUMN dex_score TO score_dex;
ALTER TABLE monsters RENAME COLUMN con_score TO score_con;
ALTER TABLE monsters RENAME COLUMN int_score TO score_int;
ALTER TABLE monsters RENAME COLUMN wis_score TO score_wis;
ALTER TABLE monsters RENAME COLUMN cha_score TO score_cha;

-- ── Monster senses: add sense_ prefix ──────────────────────────────────
ALTER TABLE monsters RENAME COLUMN senses_raw TO sense_raw;
ALTER TABLE monsters RENAME COLUMN passive_perception TO sense_passive_perception;
ALTER TABLE monsters RENAME COLUMN darkvision TO sense_darkvision;
ALTER TABLE monsters RENAME COLUMN blindsight TO sense_blindsight;
ALTER TABLE monsters RENAME COLUMN tremorsense TO sense_tremorsense;
ALTER TABLE monsters RENAME COLUMN truesight TO sense_truesight;

-- ── Fix column types: speed modes should be smallint, not text ─────────
ALTER TABLE monsters ALTER COLUMN speed_walk TYPE smallint USING speed_walk::smallint;
ALTER TABLE monsters ALTER COLUMN speed_fly TYPE smallint USING speed_fly::smallint;
ALTER TABLE monsters ALTER COLUMN speed_climb TYPE smallint USING speed_climb::smallint;
ALTER TABLE monsters ALTER COLUMN speed_swim TYPE smallint USING speed_swim::smallint;
ALTER TABLE monsters ALTER COLUMN speed_burrow TYPE smallint USING speed_burrow::smallint;

-- ── Fix column types: speed_hover should be boolean, not text ──────────
ALTER TABLE monsters ALTER COLUMN speed_hover TYPE boolean USING speed_hover::boolean;

-- ── Fix column types: sense distances should be smallint, not text ─────
ALTER TABLE monsters ALTER COLUMN sense_darkvision TYPE smallint USING sense_darkvision::smallint;
ALTER TABLE monsters ALTER COLUMN sense_blindsight TYPE smallint USING sense_blindsight::smallint;
ALTER TABLE monsters ALTER COLUMN sense_tremorsense TYPE smallint USING sense_tremorsense::smallint;
ALTER TABLE monsters ALTER COLUMN sense_truesight TYPE smallint USING sense_truesight::smallint;

-- ── Spell components: add component_ prefix ────────────────────────────
ALTER TABLE spells RENAME COLUMN verbal TO component_verbal;
ALTER TABLE spells RENAME COLUMN somatic TO component_somatic;
ALTER TABLE spells RENAME COLUMN material TO component_material;
ALTER TABLE spells RENAME COLUMN material_description TO component_material_description;
