-- Migration: 004_add_version_hash
-- Date: 2026-03-12
-- Adds a version_hash column to all content tables.
-- Stores a short hash of the source .metadata.json content so the seed
-- script can skip unchanged rows instead of blindly DELETE + INSERT.
--
-- Hash format: 8-hex-char FNV-1a (32-bit) — small, fast, high variance.
-- The column is nullable so existing rows don't need backfilling.

ALTER TABLE monsters  ADD COLUMN IF NOT EXISTS version_hash text;
ALTER TABLE heirlooms ADD COLUMN IF NOT EXISTS version_hash text;
ALTER TABLE spells    ADD COLUMN IF NOT EXISTS version_hash text;
ALTER TABLE trinkets  ADD COLUMN IF NOT EXISTS version_hash text;
