-- Migration: 001_drop_ability_modifiers
-- Date: 2026-03-09
-- Removes the redundant *_mod columns from the monsters table.
-- Modifiers are always derivable: mod = floor((score - 10) / 2).
-- Storing them was duplication — the TypeScript layer now computes them.

ALTER TABLE monsters
  DROP COLUMN IF EXISTS str_mod,
  DROP COLUMN IF EXISTS dex_mod,
  DROP COLUMN IF EXISTS con_mod,
  DROP COLUMN IF EXISTS int_mod,
  DROP COLUMN IF EXISTS wis_mod,
  DROP COLUMN IF EXISTS cha_mod;
