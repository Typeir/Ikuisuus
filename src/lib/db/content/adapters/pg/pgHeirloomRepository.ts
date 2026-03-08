/**
 * @fileoverview PostgreSQL Heirloom Repository
 * @description Implements `HeirloomRepository` by querying the `content_metadata`
 * table via the shared `pg.Pool`.
 *
 * @module lib/db/content/adapters/pg/pgHeirloomRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type { HeirloomMetadata } from '../../schemas/heirloomMetadata';

const log = logger.child({ module: 'PGHeirloomRepo' });

/** Database category discriminant. */
const CATEGORY = 'heirlooms';

/**
 * PostgreSQL-backed heirloom repository.
 *
 * Reads from the `content_metadata` table and casts `data` JSONB to typed
 * `HeirloomMetadata` records.
 */
export const pgHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      const result = await query(
        'SELECT data FROM content_metadata WHERE category = $1 AND locale = $2 ORDER BY slug ASC',
        [CATEGORY, locale],
      );
      return result.rows.map((row) => row.data as HeirloomMetadata);
    } catch (error) {
      log.error('Error reading heirloom metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<HeirloomMetadata | null> => {
    try {
      const result = await query(
        `SELECT data FROM content_metadata
         WHERE category = $1 AND locale = $2 AND slug = $3
         LIMIT 1`,
        [CATEGORY, locale, slug],
      );
      return result.rows.length > 0
        ? (result.rows[0].data as HeirloomMetadata)
        : null;
    } catch (error) {
      log.error('Error reading single heirloom from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
