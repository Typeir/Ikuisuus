/**
 * @fileoverview Content tables the metadata sync covers.
 * @description One target per content type. Mapping comes from entity property
 * metadata, so a target declares only where records live and how rows are
 * identified.
 *
 * @module lib/metadata/syncTargets
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  BloodlineEntity,
  FeatEntity,
  HeirloomEntity,
  MonsterEntity,
  RuleEntity,
  SpecializationEntity,
  SpellEntity,
  TrinketEntity,
  VocationEntity,
  WorldEntity,
} from '@/lib/db/orm/entities';
import { join } from 'path';
import { ContentType } from './contentTypes';
import type { SyncTarget } from './genericSync';
import { readMetadataFiles } from './metadataSource';

/**
 * Reader keeping only records whose source file carries one content suffix.
 *
 * The vocations tree holds vocation, specialization and spell-list sidecars
 * side by side, so the tables sharing it must discriminate by file, not by
 * directory — a directory sweep would seed a specialization as a vocation.
 *
 * @param {string} suffix - Full file suffix, e.g. `.vocation.mdx`
 * @returns {SyncTarget['readRecords']} Reader for records bearing the suffix
 */
const readMetadataFilesWithSuffix =
  (suffix: string): SyncTarget['readRecords'] =>
  async (locale, subdir) => {
    const read = await readMetadataFiles(locale, subdir);
    const records = read.records.filter(
      (record) =>
        typeof record.file === 'string' && record.file.endsWith(suffix),
    );
    return { records, sourceExists: records.length > 0 };
  };

/**
 * Sync target for every content type, keyed by {@link ContentType}.
 *
 * @constant
 */
export const SYNC_TARGETS: Readonly<Record<string, SyncTarget>> = {
  [ContentType.Monsters]: {
    entityClass: MonsterEntity,
    subdir: 'monsters',
    readRecords: readMetadataFiles,
    naturalKey: (row) => (row.subSlug as string) || (row.slug as string),
  },
  [ContentType.Heirlooms]: {
    entityClass: HeirloomEntity,
    subdir: join('items', 'heirlooms'),
    readRecords: readMetadataFiles,
  },
  [ContentType.Spells]: {
    entityClass: SpellEntity,
    subdir: 'spells',
    readRecords: readMetadataFiles,
  },
  [ContentType.Trinkets]: {
    entityClass: TrinketEntity,
    subdir: join('items', 'trinkets'),
    readRecords: readMetadataFiles,
  },
  [ContentType.Bloodlines]: {
    entityClass: BloodlineEntity,
    subdir: join('character-creation', 'bloodlines'),
    readRecords: readMetadataFiles,
  },
  [ContentType.Rules]: {
    entityClass: RuleEntity,
    subdir: 'rules',
    readRecords: readMetadataFiles,
  },
  [ContentType.World]: {
    entityClass: WorldEntity,
    subdir: 'world',
    readRecords: readMetadataFiles,
  },
  [ContentType.Feats]: {
    entityClass: FeatEntity,
    subdir: join('character-creation', 'feats'),
    readRecords: readMetadataFiles,
  },
  [ContentType.Vocations]: {
    entityClass: VocationEntity,
    subdir: join('character-creation', 'vocations'),
    readRecords: readMetadataFilesWithSuffix('.vocation.mdx'),
  },
  [ContentType.Specializations]: {
    entityClass: SpecializationEntity,
    subdir: join('character-creation', 'vocations'),
    readRecords: readMetadataFilesWithSuffix('.specialization.mdx'),
  },
};
