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

import path from 'path';
import type { HeirloomRepository } from '../../repositories/heirloomRepository';
import type { HeirloomMetadata } from '../../schemas/heirloomMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed heirloom repository.
 *
 * @class FsHeirloomRepository
 * @extends {FsMetadataRepository<HeirloomMetadata>}
 * @implements {HeirloomRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `items/heirlooms/`.
 */
class FsHeirloomRepository
  extends FsMetadataRepository<HeirloomMetadata>
  implements HeirloomRepository
{
  constructor() {
    super(path.join('items', 'heirlooms'));
  }
}

/** @type {HeirloomRepository} */
export const fsHeirloomRepository: HeirloomRepository =
  new FsHeirloomRepository();
