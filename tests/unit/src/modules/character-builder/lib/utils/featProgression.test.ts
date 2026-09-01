/**
 * @fileoverview Feat progression tests
 * @description Covers global tier feats (ceil(L/3)-1), vocation ASI/Feat rows,
 * and earned/unspent totals.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/featProgression.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
  countEarnedFeats,
  countGlobalTierFeats,
  countUnspentFeats,
  countVocationAsiFeats,
} from '@/modules/character-builder/lib/utils/featProgression';
import { describe, expect, it } from 'vitest';

const shard = (level: number, heading: string) =>
  ({ level, heading, id: `x::${level}::${heading}`, category: 'vocation-feature' }) as unknown;

const vocation = (level: number, featLevels: number[], name = 'Feat') =>
  ({
    slug: 'x',
    title: 'X',
    level,
    vocationFeatures: featLevels.map((l) => shard(l, name)),
    specializationFeatures: [],
  }) as unknown;

const character = (over: Partial<CharacterSheet>): CharacterSheet =>
  ({
    experience: 0,
    level: 1,
    vocations: [],
    selectedFeats: [],
    ...over,
  }) as unknown as CharacterSheet;

describe('countGlobalTierFeats', () => {
  it('grants one feat per tier-bonus increase (ceil(L/3) - 1)', () => {
    expect(countGlobalTierFeats(1)).toBe(0);
    expect(countGlobalTierFeats(3)).toBe(0);
    expect(countGlobalTierFeats(4)).toBe(1);
    expect(countGlobalTierFeats(6)).toBe(1);
    expect(countGlobalTierFeats(7)).toBe(2);
    expect(countGlobalTierFeats(28)).toBe(9);
    expect(countGlobalTierFeats(30)).toBe(9);
  });
});

describe('countVocationAsiFeats', () => {
  it('counts Feat rows unlocked at or below the vocation level (warrior)', () => {
    const warrior = character({
      vocations: [vocation(8, [4, 6, 8, 12, 14, 16])] as never,
    });
    expect(countVocationAsiFeats(warrior)).toBe(3);
  });

  it('matches "Ability Score Improvement" rows case-insensitively (wizard)', () => {
    const wizard = character({
      vocations: [vocation(12, [4, 8, 12, 16], 'Ability Score Improvement')] as never,
    });
    expect(countVocationAsiFeats(wizard)).toBe(3);
  });

  it('sums across multiclass vocations', () => {
    const multi = character({
      vocations: [vocation(4, [4]), vocation(8, [4, 8])] as never,
    });
    expect(countVocationAsiFeats(multi)).toBe(3);
  });

  it('ignores non-ASI feature rows', () => {
    const voc = character({
      vocations: [
        {
          slug: 'x',
          title: 'X',
          level: 20,
          vocationFeatures: [shard(4, 'Extra Attack'), shard(4, 'Feat')],
          specializationFeatures: [],
        },
      ] as never,
    });
    expect(countVocationAsiFeats(voc)).toBe(1);
  });
});

describe('countEarnedFeats / countUnspentFeats', () => {
  it('adds global tier feats to vocation ASI feats', () => {
    const c = character({ level: 8, vocations: [vocation(8, [4, 6, 8, 12])] as never });
    expect(countEarnedFeats(c)).toBe(5);
  });

  it('subtracts selected feats, clamped at 0', () => {
    const c = character({
      level: 8,
      vocations: [vocation(8, [4, 6, 8, 12])] as never,
      selectedFeats: [{ id: 'a' }, { id: 'b' }] as never,
    });
    expect(countUnspentFeats(c)).toBe(3);

    const over = character({
      level: 1,
      vocations: [],
      selectedFeats: [{ id: 'a' }] as never,
    });
    expect(countUnspentFeats(over)).toBe(0);
  });
});
