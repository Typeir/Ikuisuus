/**
 * @fileoverview Sheet Reducer Tests
 * @description Unit tests for the `sheetReducer` invariants — XP-as-source-of-truth,
 * vocation-sum floor for XP, and `level` / `proficiencyBonus` recompute on every
 * write that touches `experience` or `vocations`.
 *
 * @module tests/unit/lib/components/characterSheet/context/sheetReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    sheetReducer,
    sumVocationLevels,
    type SheetReducerState,
} from '@/lib/components/characterSheet/context/sheetReducer';
import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { getXPForLevel } from '@/lib/utils/xpProgression';
import { describe, expect, it } from 'vitest';

/**
 * Builds a vocation entry with sensible defaults for tests.
 *
 * @function vocation
 * @param {string} slug - Vocation slug
 * @param {number} level - Vocation level
 * @returns {VocationEntry} A complete vocation entry
 */
const vocation = (slug: string, level: number): VocationEntry => ({
  slug,
  title: slug,
  level,
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
});

/**
 * Wraps a character in a fresh reducer state.
 *
 * @function makeState
 * @param {Partial<CharacterSheet>} [over] - Character overrides
 * @returns {SheetReducerState} Reducer state seeded with the character
 */
const makeState = (over: Partial<CharacterSheet> = {}): SheetReducerState => {
  const character: CharacterSheet = { ...createEmptyCharacter(), ...over };
  return {
    character,
    draft: character,
    editing: true,
    activeTab: 'overview',
  };
};

describe('sheetReducer', () => {
  describe('PATCH_VOCATIONS', () => {
    it('bumps experience to vocation-sum floor when sum > xpLevel', () => {
      const state = makeState({ experience: 0, level: 1 });
      const next = sheetReducer(state, {
        type: 'PATCH_VOCATIONS',
        payload: { vocations: [vocation('wizard', 5)] },
      });
      expect(next.draft.experience).toBe(getXPForLevel(5));
      expect(next.draft.level).toBe(5);
    });

    it('leaves experience untouched when sum <= xpLevel; recomputes level cache', () => {
      const state = makeState({
        experience: getXPForLevel(10),
        level: 10,
      });
      const next = sheetReducer(state, {
        type: 'PATCH_VOCATIONS',
        payload: { vocations: [vocation('wizard', 3)] },
      });
      expect(next.draft.experience).toBe(getXPForLevel(10));
      expect(next.draft.level).toBe(10);
    });

    it('sums levels across multiple vocations and bumps XP to the total', () => {
      const state = makeState({ experience: 0 });
      const next = sheetReducer(state, {
        type: 'PATCH_VOCATIONS',
        payload: {
          vocations: [vocation('wizard', 4), vocation('fighter', 3)],
        },
      });
      expect(next.draft.level).toBe(7);
      expect(next.draft.experience).toBe(getXPForLevel(7));
    });
  });

  describe('PATCH_EXPERIENCE', () => {
    it('clamps XP up to the vocation-sum floor', () => {
      const state = makeState({
        experience: getXPForLevel(8),
        vocations: [vocation('wizard', 8)],
      });
      const next = sheetReducer(state, {
        type: 'PATCH_EXPERIENCE',
        payload: { experience: 0 },
      });
      expect(next.draft.experience).toBe(getXPForLevel(8));
      expect(next.draft.level).toBe(8);
    });

    it('accepts increased XP and recomputes level/PB', () => {
      const state = makeState({ experience: 0 });
      const next = sheetReducer(state, {
        type: 'PATCH_EXPERIENCE',
        payload: { experience: getXPForLevel(12) },
      });
      expect(next.draft.level).toBe(12);
      expect(next.draft.proficiencyBonus).toBeGreaterThanOrEqual(4);
    });
  });

  describe('PATCH (generic)', () => {
    it('strips direct writes to level and proficiencyBonus', () => {
      const state = makeState({ experience: getXPForLevel(3) });
      const next = sheetReducer(state, {
        type: 'PATCH',
        payload: { level: 99, proficiencyBonus: 99 } as Partial<CharacterSheet>,
      });
      expect(next.draft.level).toBe(3);
      expect(next.draft.proficiencyBonus).not.toBe(99);
    });

    it('routes vocations through floor-bump logic', () => {
      const state = makeState({ experience: 0 });
      const next = sheetReducer(state, {
        type: 'PATCH',
        payload: { vocations: [vocation('wizard', 6)] },
      });
      expect(next.draft.experience).toBe(getXPForLevel(6));
      expect(next.draft.level).toBe(6);
    });

    it('clamps experience patches to the vocation-sum floor', () => {
      const state = makeState({
        experience: getXPForLevel(5),
        vocations: [vocation('wizard', 5)],
      });
      const next = sheetReducer(state, {
        type: 'PATCH',
        payload: { experience: 0 },
      });
      expect(next.draft.experience).toBe(getXPForLevel(5));
    });

    it('passes through unrelated fields without disturbing the level cache', () => {
      const state = makeState({
        experience: getXPForLevel(4),
        name: 'Old',
      });
      const next = sheetReducer(state, {
        type: 'PATCH',
        payload: { name: 'New' },
      });
      expect(next.draft.name).toBe('New');
      expect(next.draft.level).toBe(4);
    });
  });

  describe('sumVocationLevels', () => {
    it('ignores entries without a slug', () => {
      expect(
        sumVocationLevels([
          vocation('wizard', 3),
          { ...vocation('', 99), slug: '' },
        ]),
      ).toBe(3);
    });
  });
});
