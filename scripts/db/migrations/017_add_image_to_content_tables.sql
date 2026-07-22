-- Migration: 017_add_image_to_content_tables
-- Date: 2026-07-22
-- Adds a nullable `image` text column to all content tables that lacked it,
-- mirroring 010_add_monster_image (monsters already have the column).
-- Stores the content-relative path extracted from Image/BlendedImage tags in
-- MDX by the metadata generators. Also simplifies the SEO thumbnail layer:
-- one uniform optional column across content types.
-- Nullable so existing rows are unaffected; populated on the next seed/sync run.

ALTER TABLE heirlooms       ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE spells          ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE trinkets        ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE bloodlines      ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE vocations       ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE specializations ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE feats           ADD COLUMN IF NOT EXISTS image text;
