/**
 * @fileoverview Filesystem Monster Repository
 * @description Implements `MonsterRepository` by reading `.metadata.json` sidecar
 * files from `src/content/{locale}/monsters/`. Multi-stat-block files are
 * automatically flattened (one entry per stat block).
 *
 * @module lib/db/content/adapters/fs/fsMonsterRepository
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import type { MonsterRepository } from '../../repositories/monsterRepository';
import type {
  MonsterIndexEntry,
  MonsterMetadata,
} from '../../schemas/monsterMetadata';
import { FsMetadataRepository } from './FsMetadataRepository';
import { readMetadataFiles } from './readMetadataFiles';

const log = logger.child({ module: 'FSMonsterRepo' });

/** Content subdirectory for monster stat blocks. */
const SUBDIR = 'monsters';

/**
 * Filesystem-backed monster repository.
 *
 * @class FsMonsterRepository
 * @extends {FsMetadataRepository<MonsterMetadata>}
 * @implements {MonsterRepository}
 *
 * @description
 * Reads `.metadata.json` sidecar files from `monsters/`. Multi-stat-block files
 * are automatically flattened (one entry per stat block). Overrides `matchSlug`
 * to resolve lookups against both `slug` and `subSlug`.
 */
class FsMonsterRepository
  extends FsMetadataRepository<MonsterMetadata>
  implements MonsterRepository
{
  constructor() {
    super(SUBDIR);
  }

  /**
   * @param {MonsterMetadata} record - Monster metadata record
   * @param {string} slug - Slug to match
   * @returns {boolean} True when `slug` matches either `record.slug` or `record.subSlug`
   */
  protected override matchSlug(record: MonsterMetadata, slug: string): boolean {
    return record.subSlug === slug || record.slug === slug;
  }

  /**
   * Returns a lightweight index of all monsters for use in dropdowns and search.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<MonsterIndexEntry[]>} Index entries, or `[]` on error
   */
  async listIndex(locale: string): Promise<MonsterIndexEntry[]> {
    try {
      const all = await readMetadataFiles<MonsterMetadata>(locale, SUBDIR);
      return all.map((m) => ({
        slug: m.subSlug || m.slug,
        title: m.title,
        cr: m.cr,
        size: m.size,
        creatureType: m.creatureType,
      }));
    } catch (error) {
      log.error('Error reading monster index from filesystem', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  }
}

/** @type {MonsterRepository} */
export const fsMonsterRepository: MonsterRepository = new FsMonsterRepository();
