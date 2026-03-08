/**
 * @fileoverview PostgreSQL Content Metadata Adapter
 * @description Implements `ContentAdapter` by querying a `content_metadata` table
 * through the shared `pg.Pool`. Each row stores one metadata record as JSONB,
 * keyed by category, locale, and slug.
 *
 * Expected table schema (create via migration or seed script):
 *
 * ```sql
 * CREATE TABLE IF NOT EXISTS content_metadata (
 *   id       SERIAL PRIMARY KEY,
 *   category TEXT NOT NULL,
 *   locale   TEXT NOT NULL DEFAULT 'en',
 *   slug     TEXT NOT NULL,
 *   data     JSONB NOT NULL,
 *   UNIQUE (category, locale, slug)
 * );
 *
 * CREATE INDEX idx_content_metadata_cat_locale
 *   ON content_metadata (category, locale);
 * ```
 *
 * Required environment variables:
 *   - `DATABASE_URL` — PostgreSQL connection string
 *
 * @module lib/db/content/postgresContentAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { ContentAdapter, ContentCategory } from './contentAdapter';

const log = logger.child({ module: 'PostgresContent' });

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * PostgreSQL content metadata adapter.
 *
 * Stores each metadata record as a JSONB column in the `content_metadata`
 * table. Reads are filtered by category + locale and optionally by slug.
 */
export const postgresContentAdapter: ContentAdapter = {
  listMetadata: async (
    category: ContentCategory,
    locale: string,
  ): Promise<Record<string, unknown>[]> => {
    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 ORDER BY slug ASC',
        [category, locale],
      );
      return result.rows.map((row) => row.data as Record<string, unknown>);
    } catch (error) {
      log.error(`Error reading ${category} metadata from PostgreSQL`, {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listMetadataBySlugs: async (
    category: ContentCategory,
    locale: string,
    slugs?: string[],
  ): Promise<Record<string, unknown>[]> => {
    if (!slugs || slugs.length === 0) {
      return postgresContentAdapter.listMetadata(category, locale);
    }

    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 AND slug = ANY($3) ORDER BY slug ASC',
        [category, locale, slugs],
      );
      return result.rows.map((row) => row.data as Record<string, unknown>);
    } catch (error) {
      log.error(`Error reading ${category} metadata by slugs from PostgreSQL`, {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slugCount: slugs.length,
      });
      return [];
    }
  },
};
