/**
 * @fileoverview Heirloom Repository Port + Factory
 * @description Defines the hexagonal port contract for heirloom metadata persistence
 * and exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 * Provides access patterns matching the real API route (`/api/heirlooms`).
 *
 * @module lib/db/content/repositories/heirloomRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { fsHeirloomRepository } from '../adapters/fs/fsHeirloomRepository';
import { mongoHeirloomRepository } from '../adapters/mongo/mongoHeirloomRepository';
import { pgHeirloomRepository } from '../adapters/pg/pgHeirloomRepository';
import type { HeirloomMetadata } from '../schemas/heirloomMetadata';

/**
 * Repository contract for heirloom metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface HeirloomRepository {
  /**
   * Returns all heirloom metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<HeirloomMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<HeirloomMetadata[]>;

  /**
   * Returns a single heirloom by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Heirloom slug identifier
   * @returns {Promise<HeirloomMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<HeirloomMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default), `'pg'`, or `'mongo'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the heirloom repository for the active backend.
 *
 * @returns {HeirloomRepository} Heirloom metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'`, `'pg'`, or `'mongo'`
 */
const createHeirloomRepository = (): HeirloomRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgHeirloomRepository;
    case 'mongo':
      return mongoHeirloomRepository;
    case 'fs':
      return fsHeirloomRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {HeirloomRepository} heirloomRepository - Resolved heirloom repository instance. */
export const heirloomRepository = createHeirloomRepository();
