/**
 * @fileoverview Sync Targets Unit Tests
 * @description Tests that every content type the metadata sync covers names the
 * right entity, directory and record reader, and that the monster natural key
 * prefers the sub-slug.
 *
 * @module tests/unit/src/lib/metadata/syncTargets.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/orm/entities', () => ({
  BloodlineEntity: class BloodlineEntity {},
  FeatEntity: class FeatEntity {},
  HeirloomEntity: class HeirloomEntity {},
  MonsterEntity: class MonsterEntity {},
  RuleEntity: class RuleEntity {},
  SpecializationEntity: class SpecializationEntity {},
  SpellEntity: class SpellEntity {},
  TrinketEntity: class TrinketEntity {},
  VocationEntity: class VocationEntity {},
  WorldEntity: class WorldEntity {},
}));

const readMetadataFiles = vi.fn();
vi.mock('@/lib/metadata/metadataSource', () => ({ readMetadataFiles }));

const { SYNC_TARGETS } = await import('@/lib/metadata/syncTargets');
const { ContentType } = await import('@/lib/metadata/contentTypes');

describe('SYNC_TARGETS', () => {
  it.each([
    [ContentType.Monsters, 'MonsterEntity', 'monsters'],
    [ContentType.Heirlooms, 'HeirloomEntity', join('items', 'heirlooms')],
    [ContentType.Spells, 'SpellEntity', 'spells'],
    [ContentType.Trinkets, 'TrinketEntity', join('items', 'trinkets')],
    [
      ContentType.Bloodlines,
      'BloodlineEntity',
      join('character-creation', 'bloodlines'),
    ],
    [ContentType.Rules, 'RuleEntity', 'rules'],
    [ContentType.World, 'WorldEntity', 'world'],
    [ContentType.Feats, 'FeatEntity', join('character-creation', 'feats')],
    [
      ContentType.Vocations,
      'VocationEntity',
      join('character-creation', 'vocations'),
    ],
    [
      ContentType.Specializations,
      'SpecializationEntity',
      join('character-creation', 'vocations', 'specializations'),
    ],
  ])('maps %s to %s under its own directory', (type, entity, subdir) => {
    const target = SYNC_TARGETS[type];

    expect(target).toBeDefined();
    expect(target.entityClass.name).toBe(entity);
    expect(target.subdir).toBe(subdir);
  });

  it('reads every target through the metadata source', () => {
    for (const target of Object.values(SYNC_TARGETS)) {
      expect(target.readRecords).toBe(readMetadataFiles);
    }
  });

  it('gives each target a distinct directory', () => {
    const subdirs = Object.values(SYNC_TARGETS).map((t) => t.subdir);

    expect(new Set(subdirs).size).toBe(subdirs.length);
  });

  it('leaves the natural key implicit for every target but monsters', () => {
    const keyed = Object.entries(SYNC_TARGETS)
      .filter(([, target]) => target.naturalKey)
      .map(([type]) => type);

    expect(keyed).toEqual([ContentType.Monsters]);
  });
});

describe('monster natural key', () => {
  const naturalKey = SYNC_TARGETS[ContentType.Monsters].naturalKey!;

  it('prefers the sub-slug, so stat blocks in one file stay distinct rows', () => {
    expect(naturalKey({ slug: 'marduk', subSlug: 'marduk-ascended' })).toBe(
      'marduk-ascended',
    );
  });

  it('falls back to the slug when there is no sub-slug', () => {
    expect(naturalKey({ slug: 'marduk' })).toBe('marduk');
  });

  it('falls back when the sub-slug is empty', () => {
    expect(naturalKey({ slug: 'marduk', subSlug: '' })).toBe('marduk');
  });
});
