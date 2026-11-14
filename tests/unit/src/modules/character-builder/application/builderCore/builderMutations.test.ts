/**
 * @fileoverview builderMutations tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderMutations.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  applyCharacterPatch,
  bloodlinePatch,
  buildBoonShardFrom,
  buildFeatShard,
  buildFeatureShards,
  featSourceFile,
  patchVocationAt,
  settleCharacter,
  snapshotVocationBase,
  specializationEntryPatch,
  stripContentPrefix,
  syncVocationBases,
  vocationEntryPatch,
} from '@/modules/character-builder/application/builderCore/builderMutations';
import { proficiencyRowKey } from '@/modules/character-builder/lib/utils/proficiencyRowKey';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import { describe, expect, it } from 'vitest';
import {
  WIZARD,
  makeCharacter,
  makeVocation,
} from '../../../../../../fixtures/builder/builderFixtures';

describe('bloodlinePatch', () => {
  it('copies budget, speeds, and parses walk speed', () => {
    const patch = bloodlinePatch('empyrean', {
      slug: 'empyrean',
      title: 'Empyrean',
      file: 'f',
      boonBudget: 4,
      coreFeatures: { movementSpeeds: ['Walk: 30 ft.', 'Fly: 20 ft.'] },
    });
    expect(patch).toEqual({
      bloodlineSlug: 'empyrean',
      bloodlineTitle: 'Empyrean',
      boonBudget: 4,
      selectedBoons: [],
      bloodlineSpeeds: ['Walk: 30 ft.', 'Fly: 20 ft.'],
      speedOverride: 30,
    });
  });

  it('clears the bloodline on an empty slug', () => {
    expect(bloodlinePatch('').bloodlineSlug).toBeNull();
  });
});

describe('feature shards', () => {
  it('strips the locale content prefix', () => {
    expect(stripContentPrefix('src/content/en/a/b.mdx')).toBe('a/b.mdx');
  });

  it('builds shards with prose when shards are given', () => {
    const shards = buildFeatureShards(
      'wizard',
      WIZARD.file,
      WIZARD.features,
      'vocation-feature',
      [{ key: 'Spellbook', source: 'prose' } as never],
    );
    expect(shards[0]).toMatchObject({
      id: 'wizard::1::Spellbook',
      sourceFile: 'character-creation/vocations/wizard/main.mdx',
      cachedText: 'prose',
      level: 1,
    });
    expect(shards[1].cachedText).toBeUndefined();
  });
});

describe('vocation entry patches', () => {
  it('resets the specialization on a vocation pick', () => {
    const patch = vocationEntryPatch('wizard', WIZARD, []);
    expect(patch).toMatchObject({
      slug: 'wizard',
      hitDie: 6,
      specializationSlug: null,
      specializationFeatures: [],
    });
    expect(vocationEntryPatch('', undefined, []).hitDie).toBe(UNKNOWN_DIE);
  });

  it('sets the specialization', () => {
    expect(specializationEntryPatch('', undefined, []).specializationSlug).toBeNull();
  });

  it('patches one entry only', () => {
    const list = [makeVocation(), makeVocation({ slug: 'b' })];
    const next = patchVocationAt(list, 1, { level: 4 });
    expect(next[0]).toBe(list[0]);
    expect(next[1].level).toBe(4);
  });
});

describe('vocation base sync', () => {
  it('snapshots metadata as row-keys', () => {
    expect(snapshotVocationBase(WIZARD)).toEqual({
      saves: ['Wisdom'],
      skillCount: 2,
      skillChoices: [
        proficiencyRowKey('skill', 'Arcana'),
        proficiencyRowKey('skill', 'History'),
      ].filter(Boolean),
      tradeFixed: [],
    });
  });

  it('returns null when in sync or without metadata', () => {
    const synced = syncVocationBases([makeVocation()], [WIZARD]);
    expect(synced).not.toBeNull();
    expect(syncVocationBases(synced ?? [], [WIZARD])).toBeNull();
    expect(syncVocationBases([makeVocation()], [])).toBeNull();
  });
});

describe('shard builders', () => {
  const feat = { slug: 'tough', title: 'Tough', grants: ['hp:2:level'] } as FeatMetadata;

  it('builds feat shards and repeat instances', () => {
    expect(buildFeatShard(feat)).toMatchObject({
      id: 'feat::tough',
      sourceFile: featSourceFile('tough'),
      category: 'feat',
      grants: ['hp:2:level'],
    });
    expect(buildFeatShard(feat, 'x').id).toBe('feat::tough::x');
  });

  it('builds boon shards', () => {
    expect(
      buildBoonShardFrom({ name: 'Extended Reach', bpValue: 3 } as never, 'empyrean', 'p'),
    ).toMatchObject({
      id: 'empyrean::Extended Reach',
      bpCost: 3,
      cachedText: 'p',
      category: 'boon',
    });
  });
});

describe('applyCharacterPatch and settleCharacter', () => {
  it('recomputes level and XP floor through the reducer', () => {
    const next = applyCharacterPatch(makeCharacter(), {
      vocations: [makeVocation({ level: 3 })],
    });
    expect(next.level).toBe(3);
    expect(next.experience).toBeGreaterThan(0);
  });

  it('syncs bases and hit dice', () => {
    const settled = settleCharacter(
      applyCharacterPatch(makeCharacter(), { vocations: [makeVocation({ level: 2 })] }),
      [WIZARD],
    );
    expect(settled.vocations[0].baseSkillChoiceCount).toBe(2);
    expect(settled.hitDiceLog).toHaveLength(2);
    expect(settled.hpMax).toBeGreaterThan(0);
  });
});
