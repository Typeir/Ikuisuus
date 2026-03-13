/**
 * @fileoverview Filesystem Trinket Repository
 * @description Implements `TrinketRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/items/trinkets/`.
 *
 * @module lib/db/content/adapters/fs/fsTrinketRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSTrinketRepo' });

/** Content subdirectory for trinket items. */
const SUBDIR = path.join('items', 'trinkets');

/**
 * Filesystem-backed trinket repository.
 *
 * Reads `.metadata.json` sidecar files and serves typed `TrinketMetadata` records.
 */
export const fsTrinketRepository: TrinketRepository = {
  list: async (locale: string): Promise<TrinketMetadata[]> => {
    try {
      return readMetadataFiles<TrinketMetadata>(locale, SUBDIR);
    } catch (error) {
      log.error('Error reading trinket metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<TrinketMetadata | null> => {
    try {
      const all = readMetadataFiles<TrinketMetadata>(locale, SUBDIR);
      return all.find((t) => t.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single trinket from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
