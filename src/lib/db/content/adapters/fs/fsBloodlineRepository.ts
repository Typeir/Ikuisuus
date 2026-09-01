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

import 'server-only';

import path from 'path';
import type { BloodlineRepository } from '../../repositories/bloodlineRepository';
import type { BloodlineMetadata } from '../../schemas/bloodlineMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed bloodline repository.
 *
 * @class FsBloodlineRepository
 * @extends {FsMetadataRepository<BloodlineMetadata>}
 * @implements {BloodlineRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `character-creation/bloodlines/`.
 * Null entries from excluded files are removed.
 */
class FsBloodlineRepository
  extends FsMetadataRepository<BloodlineMetadata>
  implements BloodlineRepository
{
  constructor() {
    super(path.join('character-creation', 'bloodlines'));
  }

  /**
   * Validates a parsed JSON record against `BloodlineMetadata` shape.
   *
   * @param {unknown} record - Raw parsed JSON record.
   * @returns {record is BloodlineMetadata} True when the record is valid.
   */
  protected filter(record: unknown): record is BloodlineMetadata {
    if (record == null || typeof record !== 'object') return false;

    const raw = record as Record<string, unknown>;
    return (
      typeof raw.slug === 'string' &&
      typeof raw.title === 'string' &&
      Array.isArray(raw.abilityScores) &&
      Array.isArray(raw.movementSpeeds) &&
      Array.isArray(raw.senses) &&
      Array.isArray(raw.size) &&
      Array.isArray(raw.creatureTypes)
    );
  }
}

/** @type {BloodlineRepository} */
export const fsBloodlineRepository: BloodlineRepository =
  new FsBloodlineRepository();
