/**
 * @fileoverview Filesystem World Repository
 * @description Implements `WorldRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/world/`.
 *
 * @module lib/db/content/adapters/fs/fsWorldRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { WorldRepository } from '../../repositories/worldRepository';
import type { WorldMetadata } from '../../schemas/worldMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed world repository.
 *
 * @class FsWorldRepository
 * @extends {FsMetadataRepository<WorldMetadata>}
 * @implements {WorldRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `world/`, nested folders included.
 */
class FsWorldRepository
  extends FsMetadataRepository<WorldMetadata>
  implements WorldRepository
{
  constructor() {
    super('world');
  }
}

/** @type {WorldRepository} */
export const fsWorldRepository: WorldRepository = new FsWorldRepository();
