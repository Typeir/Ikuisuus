/**
 * @fileoverview Filesystem Spell Repository
 * @description Implements `SpellRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/spells/`. Also merges external spells from
 * `spells-external.metadata.json` if present.
 *
 * @module lib/db/content/adapters/fs/fsSpellRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
    SpellIndexEntry,
    SpellMetadata,
} from '../../schemas/spellMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSSpellRepo' });

/** Content subdirectory for spells. */
const SUBDIR = 'spells';

/**
 * Filesystem-backed spell repository.
 *
 * Reads `.metadata.json` sidecar files and serves typed `SpellMetadata` records.
 * External spells (from `spells-external.metadata.json`) are included automatically
 * via the shared `readMetadataFiles` helper since the file matches `*.metadata.json`.
 */
export const fsSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      return readMetadataFiles<SpellMetadata>(locale, SUBDIR);
    } catch (error) {
      log.error('Error reading spell metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<SpellIndexEntry[]> => {
    try {
      const all = readMetadataFiles<SpellMetadata>(locale, SUBDIR);
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
  },

  listBySlugs: async (
    locale: string,
    slugs: string[],
  ): Promise<SpellMetadata[]> => {
    try {
      if (slugs.length === 0) {
        return readMetadataFiles<SpellMetadata>(locale, SUBDIR);
      }
      const all = readMetadataFiles<SpellMetadata>(locale, SUBDIR);
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
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpellMetadata | null> => {
    try {
      const all = readMetadataFiles<SpellMetadata>(locale, SUBDIR);
      return all.find((s) => s.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single spell from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
