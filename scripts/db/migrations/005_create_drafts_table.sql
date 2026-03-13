-- Migration: 005_create_drafts_table
-- Date: 2026-03-12
-- Creates the drafts table for temporary .mdx draft storage.
-- Supports eventual concurrency: GitHub/Bucket remains the SSOT;
-- this table holds candidate content during the edit-revalidate cycle.
--
-- Status lifecycle: active → archived (on successful revalidation)
-- Future statuses can be added without schema changes.

CREATE TABLE IF NOT EXISTS drafts (
  id            serial       PRIMARY KEY,
  locale        text         NOT NULL DEFAULT 'en',
  slug          text         NOT NULL,
  content       text         NOT NULL,
  status        text         NOT NULL DEFAULT 'active',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  version_hash  text
);

-- Fast lookup: latest active draft for a given locale + slug
CREATE INDEX IF NOT EXISTS drafts_locale_slug_status_idx
  ON drafts (locale, slug, status);

-- Partial unique index: only one active draft per locale+slug at a time
CREATE UNIQUE INDEX IF NOT EXISTS drafts_one_active_per_slug_idx
  ON drafts (locale, slug) WHERE status = 'active';
