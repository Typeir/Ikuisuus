/**
 * @fileoverview Feat Repository Port + Factory
 * @description Selects the feat metadata repository from `METADATA_BACKEND`
 * and exports a resolved instance.
 *
 * @module lib/db/content/repositories/featRepository
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import 'server-only';

import { fsFeatRepository } from '../adapters/fs/fsFeatRepository';
import { pgFeatRepository } from '../adapters/pg/pgFeatRepository';
import type { FeatMetadata } from '../schemas/featMetadata';

/**
 * Repository contract for feat metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface FeatRepository {
  /**
   * Returns all feat metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<FeatMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<FeatMetadata[]>;

  /**
   * Returns a single feat by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Feat slug identifier
   * @returns {Promise<FeatMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<FeatMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the feat repository for the active backend.
 *
 * @returns {FeatRepository} Feat metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createFeatRepository = (): FeatRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgFeatRepository;
    case 'fs':
      return fsFeatRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {FeatRepository} featRepository - Resolved feat repository instance. */
export const featRepository = createFeatRepository();
