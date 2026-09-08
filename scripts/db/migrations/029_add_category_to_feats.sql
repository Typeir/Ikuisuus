-- Migration: 029_add_category_to_feats
-- Date: 2026-09-08
-- Adds a nullable `category` text column to `feats`, holding the value the
-- `<Feat category="…">` slot declares: general, origin, epic boon or
-- fighting style. The generator emitted nothing for it before, so the feat
-- table had no way to group or filter by the taxonomy the feats index page
-- documents.
-- Nullable so existing rows are unaffected; populated on the next seed/sync run.

ALTER TABLE feats ADD COLUMN IF NOT EXISTS category text;
