/**
 * @fileoverview Filesystem Trinket Repository
 * @description Implements `TrinketRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/items/trinkets/`.
 *
 * @module lib/db/content/adapters/fs/fsTrinketRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import path from 'path';
import type { TrinketRepository } from '../../repositories/trinketRepository';
import type { TrinketMetadata } from '../../schemas/trinketMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';

/**
 * Filesystem-backed trinket repository.
 *
 * @class FsTrinketRepository
 * @extends {FsMetadataRepository<TrinketMetadata>}
 * @implements {TrinketRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `items/trinkets/`.
 */
class FsTrinketRepository
  extends FsMetadataRepository<TrinketMetadata>
  implements TrinketRepository
{
  constructor() {
    super(path.join('items', 'trinkets'));
  }
}

/** @type {TrinketRepository} */
export const fsTrinketRepository: TrinketRepository = new FsTrinketRepository();
