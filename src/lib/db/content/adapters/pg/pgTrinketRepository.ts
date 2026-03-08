/**
 * @fileoverview PostgreSQL Trinket Repository
 * @description Implements `TrinketRepository` by querying the `content_metadata`
 * table via the shared `pg.Pool`.
 *
 * @module lib/db/content/adapters/pg/pgTrinketRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';

const log = logger.child({ module: 'PGTrinketRepo' });

/** Database category discriminant. */
const CATEGORY = 'trinkets';

/**
 * PostgreSQL-backed trinket repository.
 *
 * Reads from the `content_metadata` table and casts `data` JSONB to typed
 * `TrinketMetadata` records.
 */
export const pgTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 ORDER BY slug ASC',
        [CATEGORY, locale],
      );
      return result.rows.map((row) => row.data as TrinketMetadata);
    } catch (error) {
      log.error('Error reading trinket metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<TrinketMetadata | null> => {
    try {
      const result = await query(
        `SELECT data FROM content_metadata
         WHERE category = $1 AND locale = $2 AND slug = $3
         LIMIT 1`,
        [CATEGORY, locale, slug],
      );
      return result.rows.length > 0
        ? (result.rows[0].data as TrinketMetadata)
        : null;
    } catch (error) {
      log.error('Error reading single trinket from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
