/**
 * @fileoverview Bloodline Repository Port + Factory
 * @description Defines the hexagonal port contract for bloodline metadata persistence
 * and exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 *
 * @module lib/db/content/repositories/bloodlineRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { fsBloodlineRepository } from '../adapters/fs/fsBloodlineRepository';
import { pgBloodlineRepository } from '../adapters/pg/pgBloodlineRepository';
import type { BloodlineMetadata } from '../schemas/bloodlineMetadata';

/**
 * Repository contract for bloodline metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface BloodlineRepository {
  /**
   * Returns all bloodline metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<BloodlineMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<BloodlineMetadata[]>;

  /**
   * Returns a single bloodline by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Bloodline slug identifier
   * @returns {Promise<BloodlineMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<BloodlineMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the bloodline repository for the active backend.
 *
 * @returns {BloodlineRepository} Bloodline metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createBloodlineRepository = (): BloodlineRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgBloodlineRepository;
    case 'fs':
      return fsBloodlineRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {BloodlineRepository} bloodlineRepository - Resolved bloodline repository instance. */
export const bloodlineRepository = createBloodlineRepository();
