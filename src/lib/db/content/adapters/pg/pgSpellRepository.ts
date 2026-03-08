/**
 * @fileoverview PostgreSQL Spell Repository
 * @description Implements `SpellRepository` by querying the `content_metadata`
 * table via the shared `pg.Pool`.
 *
 * @module lib/db/content/adapters/pg/pgSpellRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
    SpellIndexEntry,
    SpellMetadata,
} from '../../schemas/spellMetadata';

const log = logger.child({ module: 'PGSpellRepo' });

/** Database category discriminant. */
const CATEGORY = 'spells';

/**
 * PostgreSQL-backed spell repository.
 *
 * Reads from the `content_metadata` table and casts `data` JSONB to typed
 * `SpellMetadata` records.
 */
export const pgSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 ORDER BY slug ASC',
        [CATEGORY, locale],
      );
      return result.rows.map((row) => row.data as SpellMetadata);
    } catch (error) {
      log.error('Error reading spell metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<SpellIndexEntry[]> => {
    try {
      const result = await query(
        `SELECT
           data->>'slug' AS slug,
           data->>'title' AS title,
           (data->>'level')::int AS level,
           data->>'school' AS school
         FROM content_metadata
         WHERE category = $1 AND locale = $2
         ORDER BY data->>'title' ASC`,
        [CATEGORY, locale],
      );
      return result.rows as SpellIndexEntry[];
    } catch (error) {
      log.error('Error reading spell index from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listBySlugs: async (
    locale: string,
    slugs: string[],
  ): Promise<SpellMetadata[]> => {
    if (slugs.length === 0) {
      return pgSpellRepository.list(locale);
    }

    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 AND slug = ANY($3) ORDER BY slug ASC',
        [CATEGORY, locale, slugs],
      );
      return result.rows.map((row) => row.data as SpellMetadata);
    } catch (error) {
      log.error('Error reading spells by slugs from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slugCount: slugs.length,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpellMetadata | null> => {
    try {
      const result = await query(
        `SELECT data FROM content_metadata
         WHERE category = $1 AND locale = $2 AND slug = $3
         LIMIT 1`,
        [CATEGORY, locale, slug],
      );
      return result.rows.length > 0
        ? (result.rows[0].data as SpellMetadata)
        : null;
    } catch (error) {
      log.error('Error reading single spell from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
