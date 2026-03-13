/**
 * @fileoverview Filesystem Monster Repository
 * @description Implements `MonsterRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/monsters/`. Multi-stat-block files are
 * automatically flattened (one entry per stat block).
 *
 * @module lib/db/content/adapters/fs/fsMonsterRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { MonsterRepository } from '../../repositories/monsterRepository';
import type {
    MonsterIndexEntry,
    MonsterMetadata,
} from '../../schemas/monsterMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSMonsterRepo' });

/** Content subdirectory for monster stat blocks. */
const SUBDIR = 'monsters';

/**
 * Filesystem-backed monster repository.
 *
 * Reads `.metadata.json` sidecar files and serves typed `MonsterMetadata` records.
 */
export const fsMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      return readMetadataFiles<MonsterMetadata>(locale, SUBDIR);
    } catch (error) {
      log.error('Error reading monster metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<MonsterIndexEntry[]> => {
    try {
      const all = readMetadataFiles<MonsterMetadata>(locale, SUBDIR);
      return all.map((m) => ({
        slug: m.subSlug || m.slug,
        title: m.title,
        cr: m.cr,
        size: m.size,
        creatureType: m.creatureType,
      }));
    } catch (error) {
      log.error('Error reading monster index from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<MonsterMetadata | null> => {
    try {
      const all = readMetadataFiles<MonsterMetadata>(locale, SUBDIR);
      return all.find((m) => m.subSlug === slug || m.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single monster from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
