/**
 * @fileoverview Spell repository port and factory.
 * @description Defines the spell metadata repository contract and exports an
 * instance resolved from `METADATA_BACKEND` (`'fs'` default or `'pg'`).
 * @module lib/db/content/repositories/spellRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { fsSpellRepository } from '../adapters/fs/fsSpellRepository';
import { pgSpellRepository } from '../adapters/pg/pgSpellRepository';
import type { FilterExpression } from '../filters';
import type { SpellIndexEntry, SpellMetadata } from '../schemas/spellMetadata';

/**
 * Spell metadata repository contract.
 * Implementations return empty arrays or null when the backing store is unavailable.
 */
export interface SpellRepository {
  /**
   * Returns all spell metadata records for a locale.
   * Optional filters are pushed down to the backing store.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @param {FilterExpression[]} [filters] - Optional JSON-serializable filter list
   * @returns {Promise<SpellMetadata[]>} Full metadata array
   */
  list(locale: string, filters?: FilterExpression[]): Promise<SpellMetadata[]>;

  /**
   * Returns a lightweight index of all spells for a locale.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<SpellIndexEntry[]>} Projected index entries
   */
  listIndex(locale: string): Promise<SpellIndexEntry[]>;

  /**
   * Returns spells matching the given slugs.
   *
   * @param {string} locale - Locale code
   * @param {string[]} slugs - Array of spell slug identifiers
   * @returns {Promise<SpellMetadata[]>} Matching spells
   */
  listBySlugs(locale: string, slugs: string[]): Promise<SpellMetadata[]>;

  /**
   * Returns spells belonging to a named spell list (e.g. 'Wizard', 'Pilgrim').
   * Only meaningful for the pg backend; fs falls back to listBySlugs.
   *
   * @param {string} locale - Locale code
   * @param {string} source - Spell list name (vocation/class)
   * @returns {Promise<SpellMetadata[]>} Matching spells
   */
  listBySource(locale: string, source: string): Promise<SpellMetadata[]>;

  /**
   * Returns a single spell by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Spell slug identifier
   * @returns {Promise<SpellMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<SpellMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the spell repository for the active backend.
 *
 * @returns {SpellRepository} Spell metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createSpellRepository = (): SpellRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgSpellRepository;
    case 'fs':
      return fsSpellRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {SpellRepository} spellRepository - Resolved spell repository instance. */
export const spellRepository = createSpellRepository();
