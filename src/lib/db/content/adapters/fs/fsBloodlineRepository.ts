/**
 * @fileoverview Filesystem Bloodline Repository
 * @description Implements `BloodlineRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/character-creation/bloodlines/`.
 *
 * @module lib/db/content/adapters/fs/fsBloodlineRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';
import type { BloodlineRepository } from '../../repositories/bloodlineRepository';
import type { BloodlineMetadata } from '../../schemas/bloodlineMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSBloodlineRepo' });

/** Content subdirectory for bloodline pages. */
const SUBDIR = path.join('character-creation', 'bloodlines');

/**
 * Filesystem-backed bloodline repository.
 *
 * Reads `.metadata.json` sidecar files and serves typed `BloodlineMetadata` records.
 * Filters out null entries produced by excluded files (main.mdx, shared-boons).
 */
export const fsBloodlineRepository: BloodlineRepository = {
  list: async (locale: string): Promise<BloodlineMetadata[]> => {
    try {
      const raw = readMetadataFiles<BloodlineMetadata>(locale, SUBDIR);
      return raw.filter(Boolean);
    } catch (error) {
      log.error('Error reading bloodline metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<BloodlineMetadata | null> => {
    try {
      const all = readMetadataFiles<BloodlineMetadata>(locale, SUBDIR);
      return all.filter(Boolean).find((b) => b.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single bloodline from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
