/**
 * @fileoverview builderMetrics tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderMetrics.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  LOAD_LABELS,
  UNASSIGNED_LABELS,
  classifyLoad,
  computeBpStatus,
  computeCarryStatus,
  equipmentWeight,
  loadFlagCode,
  resolveCarrying,
  unassignedGroupKey,
} from '@/modules/character-builder/application/builderCore/builderMetrics';
import type { CharacterShard } from '@/lib/types/character';
import { describe, expect, it } from 'vitest';
import { makeCharacter } from '../../../../../../fixtures/builder/builderFixtures';

const boon = (bpCost: number): CharacterShard => ({
  id: `b${bpCost}`,
  sourceFile: 'x.mdx',
  heading: `B${bpCost}`,
  category: 'boon',
  bpCost,
});

describe('computeBpStatus', () => {
  it('reports remaining budget', () => {
    expect(computeBpStatus([boon(1), boon(2)], 4)).toEqual({
      budget: 4,
      spent: 3,
      remaining: 1,
      over: false,
    });
  });

  it('flags over budget', () => {
    expect(computeBpStatus([boon(3), boon(2)], 4).over).toBe(true);
  });
});

describe('classifyLoad', () => {
  const t = { light: 10, medium: 20, heavy: 30 };
  it.each([
    [0, 'none'],
    [5, 'light'],
    [15, 'medium'],
    [25, 'heavy'],
    [35, 'over'],
  ])('classifies %d lb as %s', (lb, tier) => {
    expect(classifyLoad(lb, t)).toBe(tier);
  });
});

describe('carry', () => {
  it('sums equipment weight', () => {
    const character = makeCharacter({
      equipment: [
        { id: 'a', name: 'Rope', quantity: 2, weightLb: 5 },
        { id: 'b', name: 'Pack', quantity: 1, weightLb: 3 },
      ],
    });
    expect(equipmentWeight(character)).toBe(13);
  });

  it('adds extra pounds only on top of equipment or alone', () => {
    const character = makeCharacter();
    expect(computeCarryStatus(character, { extraLb: 7 }).carriedLb).toBe(7);
    expect(computeCarryStatus(character).tier).toBe('none');
  });

  it('reads stored carry inputs, with call overrides winning key by key', () => {
    const character = makeCharacter({
      carrying: { size: 'large', extraLb: 7 },
    });
    expect(resolveCarrying(makeCharacter())).toEqual({
      size: 'medium',
      quadruped: false,
      extraLb: 0,
    });
    expect(resolveCarrying(character, { extraLb: -3, quadruped: true })).toEqual(
      { size: 'large', quadruped: true, extraLb: 0 },
    );
    const status = computeCarryStatus(character);
    expect(status.carriedLb).toBe(7);
    expect(status.thresholds).toEqual(
      computeCarryStatus(makeCharacter(), { size: 'large' }).thresholds,
    );
  });

  it('maps red tiers to flag codes', () => {
    expect(loadFlagCode('over')).toBe('CARRY_OVER_CAPACITY');
    expect(loadFlagCode('heavy')).toBe('CARRY_HEAVY_LOAD');
    expect(loadFlagCode('medium')).toBeNull();
    expect(LOAD_LABELS.over).toBe('Over capacity');
  });
});

describe('unassigned labels', () => {
  it('keys groups by category and tier', () => {
    expect(unassignedGroupKey({ category: 'feat', count: 1 })).toBe('feat:');
    expect(
      unassignedGroupKey({ category: 'skill', tier: 'expertise', count: 1 }),
    ).toBe('skill:expertise');
    expect(UNASSIGNED_LABELS['skill:proficient'].code).toBe(
      'UNASSIGNED_SKILL_PROFICIENCY',
    );
  });
});
