/**
 * @fileoverview Trinket Repository Port + Factory
 * @description Defines the hexagonal port contract for trinket metadata persistence
 * and exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 * Provides access patterns matching the real API route (`/api/trinkets`).
 *
 * @module lib/db/content/repositories/trinketRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { fsTrinketRepository } from '../adapters/fs/fsTrinketRepository';
import { mongoTrinketRepository } from '../adapters/mongo/mongoTrinketRepository';
import { pgTrinketRepository } from '../adapters/pg/pgTrinketRepository';
import type { TrinketMetadata } from '../schemas/trinketMetadata';

/**
 * Repository contract for trinket metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface TrinketRepository {
  /**
   * Returns all trinket metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<TrinketMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<TrinketMetadata[]>;

  /**
   * Returns a single trinket by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Trinket slug identifier
   * @returns {Promise<TrinketMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<TrinketMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default), `'pg'`, or `'mongo'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the trinket repository for the active backend.
 *
 * @returns {TrinketRepository} Trinket metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'`, `'pg'`, or `'mongo'`
 */
const createTrinketRepository = (): TrinketRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgTrinketRepository;
    case 'mongo':
      return mongoTrinketRepository;
    case 'fs':
      return fsTrinketRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {TrinketRepository} trinketRepository - Resolved trinket repository instance. */
export const trinketRepository = createTrinketRepository();
