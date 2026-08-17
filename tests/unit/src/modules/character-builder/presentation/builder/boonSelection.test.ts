/**
 * @fileoverview applySubOptionSelection Unit Tests
 * @description Verifies the choose-one / pick-any BP math and shard lifecycle
 * for variable-cost boon sub-option selection.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/boonSelection
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import type { CharacterShard } from '@/lib/types/character';
import {
  applySubOptionSelection,
  pickedOptionTags,
} from '@/modules/character-builder/presentation/builder/boonSelection';
import { describe, expect, it } from 'vitest';

const chooseOne: BloodlineBoon = {
  name: 'Frame',
  bpLabel: 'Variable BP - Choose One',
  subOptionMode: 'choose-one',
  subOptions: [
    { name: 'Powerful Build', bpValue: 1 },
    { name: 'Large Frame', bpValue: 3 },
  ],
  sortOrder: 0,
  tags: [],
};

const pickAny: BloodlineBoon = {
  name: 'Vision',
  bpLabel: 'Variable - Pick Any Combination',
  subOptionMode: 'pick-any',
  subOptions: [
    { name: 'Darkvision', bpValue: 1 },
    { name: 'Truesight', bpValue: 5 },
  ],
  sortOrder: 1,
  tags: [],
};

const shard = (
  heading: string,
  bpCost: number,
  selectedSubOptions: string[],
): CharacterShard => ({
  id: `x::${heading}`,
  sourceFile: 'x',
  heading,
  category: 'boon',
  bpCost,
  selectedSubOptions,
});

describe('applySubOptionSelection', () => {
  it('creates a shard with the chosen option cost when not yet selected', () => {
    const next = applySubOptionSelection(
      [],
      chooseOne,
      'Large Frame',
      'silent-one',
    );
    expect(next).toHaveLength(1);
    expect(next[0].heading).toBe('Frame');
    expect(next[0].id).toBe('silent-one::Frame');
    expect(next[0].selectedSubOptions).toEqual(['Large Frame']);
    expect(next[0].bpCost).toBe(3);
  });

  it('replaces the choice for choose-one boons', () => {
    const next = applySubOptionSelection(
      [shard('Frame', 3, ['Large Frame'])],
      chooseOne,
      'Powerful Build',
      'silent-one',
    );
    expect(next[0].selectedSubOptions).toEqual(['Powerful Build']);
    expect(next[0].bpCost).toBe(1);
  });

  it('accumulates and sums cost for pick-any boons', () => {
    const next = applySubOptionSelection(
      [shard('Vision', 1, ['Darkvision'])],
      pickAny,
      'Truesight',
      'silent-one',
    );
    expect(next[0].selectedSubOptions).toEqual(['Darkvision', 'Truesight']);
    expect(next[0].bpCost).toBe(6);
  });

  it('removes the boon when the last pick-any option is unchecked', () => {
    const next = applySubOptionSelection(
      [shard('Vision', 1, ['Darkvision'])],
      pickAny,
      'Darkvision',
      'silent-one',
    );
    expect(next).toHaveLength(0);
  });

  it('keeps the boon with recalculated cost when one of several is unchecked', () => {
    const next = applySubOptionSelection(
      [shard('Vision', 6, ['Darkvision', 'Truesight'])],
      pickAny,
      'Truesight',
      'silent-one',
    );
    expect(next[0].selectedSubOptions).toEqual(['Darkvision']);
    expect(next[0].bpCost).toBe(1);
  });
});

describe('pickedOptionTags', () => {
  const tagged: BloodlineBoon = {
    ...pickAny,
    subOptions: [
      { name: 'Darkvision', bpValue: 1, tags: ['sense:darkvision'] },
      { name: 'Truesight', bpValue: 5, tags: ['sense:truesight', 'sense:darkvision'] },
    ],
    tags: ['sense:darkvision', 'sense:truesight', 'resource:variable'],
  };

  it('unions the tags of the picked options only', () => {
    expect(pickedOptionTags(tagged, ['Darkvision'])).toEqual(['sense:darkvision']);
    expect(pickedOptionTags(tagged, ['Truesight', 'Darkvision'])).toEqual([
      'sense:truesight',
      'sense:darkvision',
    ]);
  });

  it('falls back to the boon roll-up when no option carries tags', () => {
    expect(pickedOptionTags({ ...pickAny, tags: ['a:b'] }, ['Darkvision'])).toEqual(['a:b']);
  });

  it('writes the picked tags onto the shard', () => {
    const [s] = applySubOptionSelection([], tagged, 'Truesight', 'x');
    expect(s.tags).toEqual(['sense:truesight', 'sense:darkvision']);
  });
});

