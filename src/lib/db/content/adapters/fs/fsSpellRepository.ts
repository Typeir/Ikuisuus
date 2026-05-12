/**
 * @fileoverview Filesystem Spell Repository
 * @description Implements `SpellRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/spells/`.
 *
 * @module lib/db/content/adapters/fs/fsSpellRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import {
  applyFiltersInMemory,
  type FilterExpression,
} from '../../filters';
import type {
    SpellIndexEntry,
    SpellMetadata,
} from '../../schemas/spellMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSSpellRepo' });

/** Content subdirectory for spells. */
const SUBDIR = 'spells';

/**
 * Filesystem-backed spell repository.
 *
 * @class FsSpellRepository
 * @extends {FsMetadataRepository<SpellMetadata>}
 * @implements {SpellRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `spells/`.
 */
class FsSpellRepository
  extends FsMetadataRepository<SpellMetadata>
  implements SpellRepository
{
  constructor() {
    super(SUBDIR);
  }

  /**
   * Returns all spell metadata for the locale, optionally filtered in memory.
   *
   * Maintains parity with the pg adapter when `METADATA_BACKEND=fs` so that
   * the same `FilterExpression[]` payload behaves identically across backends.
   *
   * @param {string} locale - Locale code
   * @param {FilterExpression[]} [filters] - Optional JSON-serializable filter list
   * @returns {Promise<SpellMetadata[]>} Filtered metadata array, or `[]` on error
   */
  override async list(
    locale: string,
    filters?: FilterExpression[],
  ): Promise<SpellMetadata[]> {
    const all = await super.list(locale);
    if (!filters || filters.length === 0) return all;
    return applyFiltersInMemory(all, filters);
  }

  /**
   * Returns a lightweight sorted index of all spells.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<SpellIndexEntry[]>} Sorted index entries, or `[]` on error
   */
  async listIndex(locale: string): Promise<SpellIndexEntry[]> {
    try {
      const all = await readMetadataFiles<SpellMetadata>(locale, SUBDIR);
      const index = all.map((s) => ({
        slug: s.slug,
        title: s.title,
        level: s.level,
        school: s.school,
      }));
      index.sort((a, b) => a.title.localeCompare(b.title));
      return index;
    } catch (error) {
      log.error('Error reading spell index from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  }

  /**
   * Returns spells matching the provided slug set. Passing an empty array
   * returns all spells.
   *
   * @param {string} locale - Locale code
   * @param {string[]} slugs - Slug allowlist; empty means all
   * @returns {Promise<SpellMetadata[]>} Matching spell records, or `[]` on error
   */
  async listBySlugs(locale: string, slugs: string[]): Promise<SpellMetadata[]> {
    try {
      if (slugs.length === 0) {
        return await readMetadataFiles<SpellMetadata>(locale, SUBDIR);
      }
      const all = await readMetadataFiles<SpellMetadata>(locale, SUBDIR);
      const slugSet = new Set(slugs);
      return all.filter((s) => slugSet.has(s.slug));
    } catch (error) {
      log.error('Error reading spell metadata by slugs from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slugCount: slugs.length,
      });
      return [];
    }
  }

  /**
   * Returns all spells regardless of source (source filtering is a PG concern).
   *
   * @param {string} locale - Locale code
   * @param {string} _source - Ignored in the FS adapter
   * @returns {Promise<SpellMetadata[]>} All spell records
   */
  async listBySource(
    locale: string,
    _source: string,
  ): Promise<SpellMetadata[]> {
    return this.list(locale);
  }
}

/** @type {SpellRepository} */
export const fsSpellRepository: SpellRepository = new FsSpellRepository();
