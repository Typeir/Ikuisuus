/**
 * @fileoverview World Repository Port + Factory
 * @description Selects the world metadata repository from `METADATA_BACKEND`
 * and exports a resolved instance.
 *
 * @module lib/db/content/repositories/worldRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { fsWorldRepository } from '../adapters/fs/fsWorldRepository';
import { pgWorldRepository } from '../adapters/pg/pgWorldRepository';
import type { WorldMetadata } from '../schemas/worldMetadata';

/**
 * Repository contract for world and lore metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface WorldRepository {
  /**
   * Returns all world metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<WorldMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<WorldMetadata[]>;

  /**
   * Returns a single world entry by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - World slug identifier
   * @returns {Promise<WorldMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<WorldMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the world repository for the active backend.
 *
 * @returns {WorldRepository} World metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createWorldRepository = (): WorldRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgWorldRepository;
    case 'fs':
      return fsWorldRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {WorldRepository} worldRepository - Resolved world repository instance. */
export const worldRepository = createWorldRepository();
