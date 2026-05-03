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
 * Null entries produced by excluded files (main.mdx, shared-boons) are removed
 * by the base-class default `filter` (non-null guard).
 */
class FsBloodlineRepository
  extends FsMetadataRepository<BloodlineMetadata>
  implements BloodlineRepository
{
  constructor() {
    super(path.join('character-creation', 'bloodlines'), 'FSBloodlineRepo');
  }
}

/** @type {BloodlineRepository} */
export const fsBloodlineRepository: BloodlineRepository =
  new FsBloodlineRepository();
