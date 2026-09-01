/**
 * @fileoverview Vocation Repository Port + Factory
 * @description Defines the port contract for vocation metadata persistence and
 * exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 *
 * @module lib/db/content/repositories/vocationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import 'server-only';

import { fsVocationRepository } from '../adapters/fs/fsVocationRepository';
import { pgVocationRepository } from '../adapters/pg/pgVocationRepository';
import type { VocationMetadata } from '../schemas/vocationMetadata';

/**
 * Repository contract for vocation metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface VocationRepository {
  /**
   * Returns all vocation metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<VocationMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<VocationMetadata[]>;

  /**
   * Returns a single vocation by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Vocation slug identifier
   * @returns {Promise<VocationMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<VocationMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the vocation repository for the active backend.
 *
 * @returns {VocationRepository} Vocation metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createVocationRepository = (): VocationRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgVocationRepository;
    case 'fs':
      return fsVocationRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {VocationRepository} vocationRepository - Resolved vocation repository instance. */
export const vocationRepository = createVocationRepository();
