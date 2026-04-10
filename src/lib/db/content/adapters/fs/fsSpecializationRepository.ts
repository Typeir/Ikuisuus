/**
 * @fileoverview Filesystem Specialization Repository
 * @description Implements `SpecializationRepository` by reading `.metadata.json`
 * sidecar files from `.meta/{locale}/character-creation/vocations/` or
 * `src/content/{locale}/character-creation/vocations/`.
 *
 * Distinguishes specialization records from vocation records by the presence of
 * the `vocation` field (unique to specializations).
 *
 * @module lib/db/content/adapters/fs/fsSpecializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';
import type { SpecializationRepository } from '../../repositories/specializationRepository';
import type { SpecializationMetadata } from '../../schemas/specializationMetadata';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSSpecializationRepo' });

/** Content subdirectory for specialization pages. */
const SUBDIR = path.join('character-creation', 'vocations', 'specializations');

/**
 * Type guard for specialization metadata records.
 *
 * @param {unknown} record - Parsed metadata record
 * @returns {boolean} True if record has `vocation` field (specialization indicator)
 */
function isSpecializationRecord(
  record: unknown,
): record is SpecializationMetadata {
  return (
    record !== null &&
    typeof record === 'object' &&
    'vocation' in record &&
    'specializationType' in record
  );
}

/**
 * Filesystem-backed specialization repository.
 *
 * Reads `.metadata.json` sidecar files and filters for specialization records
 * (distinguished from vocation records by the `vocation` field).
 */
export const fsSpecializationRepository: SpecializationRepository = {
  list: async (locale: string): Promise<SpecializationMetadata[]> => {
    try {
      const raw = readMetadataFiles<SpecializationMetadata>(locale, SUBDIR);
      return raw.filter(isSpecializationRecord);
    } catch (error) {
      log.error('Error reading specialization metadata from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpecializationMetadata | null> => {
    try {
      const all = readMetadataFiles<SpecializationMetadata>(locale, SUBDIR);
      return (
        all.filter(isSpecializationRecord).find((s) => s.slug === slug) ?? null
      );
    } catch (error) {
      log.error('Error reading single specialization from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },

  listByVocation: async (
    locale: string,
    vocation: string,
  ): Promise<SpecializationMetadata[]> => {
    try {
      const all = readMetadataFiles<SpecializationMetadata>(locale, SUBDIR);
      return all
        .filter(isSpecializationRecord)
        .filter((s) => s.vocation === vocation);
    } catch (error) {
      log.error('Error reading specializations by vocation from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        vocation,
      });
      return [];
    }
  },
};
