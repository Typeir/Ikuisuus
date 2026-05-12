/**
 * @fileoverview Spell Repository Port + Factory
 * @description Defines the hexagonal port contract for spell metadata persistence
 * and exports a factory-resolved instance based on `METADATA_BACKEND` env var.
 * Provides access patterns matching the real API routes:
 * - `/api/spells` (list all, or POST with slug array)
 * - `/api/spells/index` (lightweight index)
 * - `/api/spells/[slug]` (single-record lookup)
 *
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
 * Repository contract for spell metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface SpellRepository {
  /**
   * Returns all spell metadata records for a locale.
   *
   * Optional filters are pushed down to the backing store. The pg adapter
   * translates them into a MikroORM query; the fs adapter applies them in
   * memory after reading the metadata files.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @param {FilterExpression[]} [filters] - Optional JSON-serializable filter list
   * @returns {Promise<SpellMetadata[]>} Full metadata array
   */
  list(locale: string, filters?: FilterExpression[]): Promise<SpellMetadata[]>;

  /**
   * Returns a lightweight index of all spells for a locale.
   * Used by dropdowns and select components.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<SpellIndexEntry[]>} Projected index entries
   */
  listIndex(locale: string): Promise<SpellIndexEntry[]>;

  /**
   * Returns spells matching the given slugs.
   * Used by POST /api/spells for filtered table views.
   *
   * @param {string} locale - Locale code
   * @param {string[]} slugs - Array of spell slug identifiers
   * @returns {Promise<SpellMetadata[]>} Matching spells
   */
  listBySlugs(locale: string, slugs: string[]): Promise<SpellMetadata[]>;

  /**
   * Returns spells belonging to a named spell list (e.g. 'Wizard', 'Cleric').
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
