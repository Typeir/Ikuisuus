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
import { FsMetadataRepository } from './FsMetadataRepository';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSSpecializationRepo' });

/** Content subdirectory for specialization pages. */
const SUBDIR = path.join('character-creation', 'vocations', 'specializations');

/**
 * Filesystem-backed specialization repository.
 *
 * @class FsSpecializationRepository
 * @extends {FsMetadataRepository<SpecializationMetadata>}
 * @implements {SpecializationRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `character-creation/vocations/specializations/`.
 * Overrides `filter` to exclude vocation records (distinguished from specializations
 * by the absence of `vocation` and `specializationType` fields).
 */
class FsSpecializationRepository
  extends FsMetadataRepository<SpecializationMetadata>
  implements SpecializationRepository
{
  constructor() {
    super(SUBDIR, 'FSSpecializationRepo');
  }

  /**
   * @param {unknown} record - Raw parsed JSON record
   * @returns {record is SpecializationMetadata} True when both `vocation` and `specializationType` fields are present
   */
  protected override filter(record: unknown): record is SpecializationMetadata {
    return (
      record !== null &&
      typeof record === 'object' &&
      'vocation' in record &&
      'specializationType' in record
    );
  }

  /**
   * Returns all specializations belonging to a given vocation.
   *
   * @param {string} locale - Locale code
   * @param {string} vocation - Vocation slug to filter by
   * @returns {Promise<SpecializationMetadata[]>} Matching specializations, or `[]` on error
   */
  async listByVocation(
    locale: string,
    vocation: string,
  ): Promise<SpecializationMetadata[]> {
    try {
      const all = await readMetadataFiles<SpecializationMetadata>(
        locale,
        SUBDIR,
      );
      return all
        .filter((r): r is SpecializationMetadata => this.filter(r))
        .filter((s) => s.vocation === vocation);
    } catch (error) {
      log.error('Error reading specializations by vocation from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        vocation,
      });
      return [];
    }
  }
}

/** @type {SpecializationRepository} */
export const fsSpecializationRepository: SpecializationRepository =
  new FsSpecializationRepository();
