-- Migration: 011_add_description_to_content_tables
-- Date: 2026-04-23
-- Adds a nullable `description` text column to all content tables that have
-- description extraction in their metadata generators but were missing the column.
-- Bloodlines already have this column — all others are added here.
-- Nullable so existing rows are unaffected; populated on the next seed/sync run.

ALTER TABLE monsters        ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE heirlooms       ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE spells          ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE trinkets        ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE vocations       ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE specializations ADD COLUMN IF NOT EXISTS description text;
