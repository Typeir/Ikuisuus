/**
 * @fileoverview Filesystem Vocation Repository
 * @description Implements `VocationRepository` by reading `.metadata.json` sidecar
 * files from `.meta/{locale}/character-creation/vocations/` or
 * `src/content/{locale}/character-creation/vocations/`.
 *
 * @module lib/db/content/adapters/fs/fsVocationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import 'server-only';

import path from 'path';
import type { VocationRepository } from '../../repositories/vocationRepository';
import type { VocationMetadata } from '../../schemas/vocationMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed vocation repository.
 *
 * @class FsVocationRepository
 * @extends {FsMetadataRepository<VocationMetadata>}
 * @implements {VocationRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `character-creation/vocations/`.
 */
class FsVocationRepository
  extends FsMetadataRepository<VocationMetadata>
  implements VocationRepository
{
  constructor() {
    super(path.join('character-creation', 'vocations'));
  }

  /**
   * @param {unknown} record - Raw parsed JSON record
   * @returns {record is VocationMetadata} True when both `archetype` and `hitDie` fields are present
   */
  protected override filter(record: unknown): record is VocationMetadata {
    return (
      record !== null &&
      typeof record === 'object' &&
      'archetype' in record &&
      'hitDie' in record
    );
  }
}

/** @type {VocationRepository} */
export const fsVocationRepository: VocationRepository =
  new FsVocationRepository();
