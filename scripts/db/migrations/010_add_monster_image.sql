-- Migration: 010_add_monster_image
-- Date: 2026-06-14
-- Adds an image column to the monsters table.
-- Stores the content-relative path extracted from BlendedImage tags in MDX.
-- Nullable so existing rows don't need backfilling (populated on next seed run).

ALTER TABLE monsters ADD COLUMN IF NOT EXISTS image text;
