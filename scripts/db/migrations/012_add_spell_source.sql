-- Migration: 012_add_spell_source
-- Date: 2026-07-11
-- Adds a nullable `source` column to the `spells` table.
-- Backfills existing external SRD spells (file = 'external') to source = 'basic'.
-- Semantics: NULL = native Damocles, 'basic' = SRD 5.1 (OGL), other = campaign-specific.

ALTER TABLE spells ADD COLUMN IF NOT EXISTS source varchar;

UPDATE spells SET source = 'basic' WHERE file = 'external';
