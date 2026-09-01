/**
 * @fileoverview Specialization Repository Port + Factory
 * @description Defines the hexagonal port contract for specialization metadata
 * persistence and exports a factory-resolved instance based on `METADATA_BACKEND`
 * env var.
 *
 * @module lib/db/content/repositories/specializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import 'server-only';

import { fsSpecializationRepository } from '../adapters/fs/fsSpecializationRepository';
import { pgSpecializationRepository } from '../adapters/pg/pgSpecializationRepository';
import type { SpecializationMetadata } from '../schemas/specializationMetadata';

/**
 * Repository contract for specialization metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface SpecializationRepository {
  /**
   * Returns all specialization metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<SpecializationMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<SpecializationMetadata[]>;

  /**
   * Returns a single specialization by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Specialization slug identifier
   * @returns {Promise<SpecializationMetadata | null>} Matched record or null
   */
  getBySlug(
    locale: string,
    slug: string,
  ): Promise<SpecializationMetadata | null>;

  /**
   * Returns all specializations belonging to a vocation.
   *
   * @param {string} locale - Locale code
   * @param {string} vocation - Parent vocation slug
   * @returns {Promise<SpecializationMetadata[]>} Filtered metadata array
   */
  listByVocation(
    locale: string,
    vocation: string,
  ): Promise<SpecializationMetadata[]>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the specialization repository for the active backend.
 *
 * @returns {SpecializationRepository} Specialization metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createSpecializationRepository = (): SpecializationRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgSpecializationRepository;
    case 'fs':
      return fsSpecializationRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {SpecializationRepository} specializationRepository - Resolved specialization repository instance. */
export const specializationRepository = createSpecializationRepository();
