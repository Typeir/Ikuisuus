/**
 * @fileoverview Filesystem Heirloom Repository
 * @description Implements `HeirloomRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/items/heirlooms/`.
 *
 * @module lib/db/content/adapters/fs/fsHeirloomRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type { HeirloomMetadata } from '../../schemas/heirloomMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSHeirloomRepo' });

/** Content subdirectory for heirloom items. */
const SUBDIR = path.join('items', 'heirlooms');

/**
 * Filesystem-backed heirloom repository.
 *
 * Reads `.metadata.json` sidecar files and serves typed `HeirloomMetadata` records.
 */
export const fsHeirloomRepository: HeirloomRepository = {
  list: async (locale: string): Promise<HeirloomMetadata[]> => {
    try {
      return readMetadataFiles<HeirloomMetadata>(locale, SUBDIR);
    } catch (error) {
      log.error('Error reading heirloom metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<HeirloomMetadata | null> => {
    try {
      const all = readMetadataFiles<HeirloomMetadata>(locale, SUBDIR);
      return all.find((h) => h.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single heirloom from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
