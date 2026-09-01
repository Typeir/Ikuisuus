/**
 * @fileoverview Filesystem Feat Repository
 * @description Implements `FeatRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/character-creation/feats/`.
 *
 * @module lib/db/content/adapters/fs/fsFeatRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import 'server-only';

import path from 'path';
import type { FeatRepository } from '../../repositories/featRepository';
import type { FeatMetadata } from '../../schemas/featMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed feat repository.
 *
 * @class FsFeatRepository
 * @extends {FsMetadataRepository<FeatMetadata>}
 * @implements {FeatRepository}
 */
class FsFeatRepository
  extends FsMetadataRepository<FeatMetadata>
  implements FeatRepository
{
  constructor() {
    super(path.join('character-creation', 'feats'));
  }

  /**
   * Validates that a record is a `FeatMetadata` shape.
   *
   * @param {unknown} record - Raw parsed JSON record
   * @returns {record is FeatMetadata} True when the record is valid
   */
  protected filter(record: unknown): record is FeatMetadata {
    if (record == null || typeof record !== 'object') return false;
    const raw = record as Record<string, unknown>;
    return (
      typeof raw.slug === 'string' &&
      typeof raw.title === 'string' &&
      typeof raw.hasPrerequisite === 'boolean' &&
      Array.isArray(raw.tags)
    );
  }
}

/** @type {FeatRepository} */
export const fsFeatRepository: FeatRepository = new FsFeatRepository();
