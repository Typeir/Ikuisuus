/**
 * @fileoverview Monster Repository Port + Factory
 * @description Defines the hexagonal port contract for monster metadata persistence
 * and exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 *
 * Provides three access patterns matching the real API routes:
 * - `list()` — full metadata array for the table view (`/api/monsters`)
 * - `listIndex()` — lightweight projection for combobox search (`/api/monsters/index`)
 * - `getBySlug()` — single record lookup (`/api/monsters/[slug]`)
 *
 * @module lib/db/content/repositories/monsterRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { fsMonsterRepository } from '../adapters/fs/fsMonsterRepository';
import { pgMonsterRepository } from '../adapters/pg/pgMonsterRepository';
import type {
    MonsterIndexEntry,
    MonsterMetadata,
} from '../schemas/monsterMetadata';

/**
 * Repository contract for monster metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface MonsterRepository {
  /**
   * Returns all monster metadata records for a locale.
   * Multi-stat-block files are pre-flattened (one entry per stat block).
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<MonsterMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<MonsterMetadata[]>;

  /**
   * Returns lightweight monster index entries for dropdown search.
   * Only includes slug, title, cr, size, and creatureType.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<MonsterIndexEntry[]>} Minimal projection array
   */
  listIndex(locale: string): Promise<MonsterIndexEntry[]>;

  /**
   * Returns a single monster by slug or subSlug.
   * For multi-stat-block files, matches on `subSlug` first, then `slug`.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Monster slug or subSlug identifier
   * @returns {Promise<MonsterMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<MonsterMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the monster repository for the active backend.
 *
 * @returns {MonsterRepository} Monster metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createMonsterRepository = (): MonsterRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgMonsterRepository;
    case 'fs':
      return fsMonsterRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {MonsterRepository} monsterRepository - Resolved monster repository instance. */
export const monsterRepository = createMonsterRepository();
