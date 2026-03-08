/**
 * @fileoverview PostgreSQL Monster Repository
 * @description Implements `MonsterRepository` by querying the `content_metadata`
 * table via the shared `pg.Pool`. Each monster stat block is stored as a JSONB
 * row keyed by `(category='monsters', locale, slug)`.
 *
 * @module lib/db/content/adapters/pg/pgMonsterRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { MonsterRepository } from '../../repositories/monsterRepository';
import type {
    MonsterIndexEntry,
    MonsterMetadata,
} from '../../schemas/monsterMetadata';

const log = logger.child({ module: 'PGMonsterRepo' });

/** Database category discriminant. */
const CATEGORY = 'monsters';

/**
 * PostgreSQL-backed monster repository.
 *
 * Reads from the `content_metadata` table and casts `data` JSONB to typed
 * `MonsterMetadata` records.
 */
export const pgMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 ORDER BY slug ASC',
        [CATEGORY, locale],
      );
      return result.rows.map((row) => row.data as MonsterMetadata);
    } catch (error) {
      log.error('Error reading monster metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<MonsterIndexEntry[]> => {
    try {
      const result = await query(
        `SELECT
           COALESCE(data->>'subSlug', data->>'slug') AS slug,
           data->>'title' AS title,
           data->>'cr' AS cr,
           data->>'size' AS size,
           data->>'creatureType' AS "creatureType"
         FROM content_metadata
         WHERE category = $1 AND locale = $2
         ORDER BY slug ASC`,
        [CATEGORY, locale],
      );
      return result.rows as MonsterIndexEntry[];
    } catch (error) {
      log.error('Error reading monster index from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<MonsterMetadata | null> => {
    try {
      const result = await query(
        `SELECT data FROM content_metadata
         WHERE category = $1 AND locale = $2
           AND (data->>'subSlug' = $3 OR data->>'slug' = $3)
         LIMIT 1`,
        [CATEGORY, locale, slug],
      );
      return result.rows.length > 0
        ? (result.rows[0].data as MonsterMetadata)
        : null;
    } catch (error) {
      log.error('Error reading single monster from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
