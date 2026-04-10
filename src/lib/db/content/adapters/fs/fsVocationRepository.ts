/**
 * @fileoverview Filesystem Vocation Repository
 * @description Implements `VocationRepository` by reading `.metadata.json` sidecar
 * files from `.meta/{locale}/character-creation/vocations/` or
 * `src/content/{locale}/character-creation/vocations/`.
 *
 * Distinguishes vocation records from specialization records by the presence of
 * the `archetype` field (unique to vocations).
 *
 * @module lib/db/content/adapters/fs/fsVocationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';
import type { VocationRepository } from '../../repositories/vocationRepository';
import type { VocationMetadata } from '../../schemas/vocationMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSVocationRepo' });

/** Content subdirectory for vocation pages. */
const SUBDIR = path.join('character-creation', 'vocations');

/**
 * Type guard for vocation metadata records.
 *
 * @param {unknown} record - Parsed metadata record
 * @returns {boolean} True if record has `archetype` field (vocation indicator)
 */
function isVocationRecord(record: unknown): record is VocationMetadata {
  return (
    record !== null &&
    typeof record === 'object' &&
    'archetype' in record &&
    'hitDie' in record
  );
}

/**
 * Filesystem-backed vocation repository.
 *
 * Reads `.metadata.json` sidecar files and filters for vocation records
 * (distinguished from specialization records by the `archetype` field).
 */
export const fsVocationRepository: VocationRepository = {
  list: async (locale: string): Promise<VocationMetadata[]> => {
    try {
      const raw = readMetadataFiles<VocationMetadata>(locale, SUBDIR);
      return raw.filter(isVocationRecord);
    } catch (error) {
      log.error('Error reading vocation metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<VocationMetadata | null> => {
    try {
      const all = readMetadataFiles<VocationMetadata>(locale, SUBDIR);
      return all.filter(isVocationRecord).find((v) => v.slug === slug) ?? null;
    } catch (error) {
      log.error('Error reading single vocation from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
