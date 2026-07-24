/**
 * @fileoverview recalculateHpMax Unit Tests
 * @description Verifies max HP is a pure, drift-free function of the hit dice
 * log across re-rolls, prunes, and CON changes.
 *
 * @module tests/unit/modules/character-builder/lib/utils/hitDiceUtils
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { recalculateHpMax } from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { describe, expect, it } from 'vitest';

/**
 * Builds a hit die entry with sensible defaults, overridable per test.
 *
 * @param {Partial<HitDieRollEntry> & { id: string }} overrides - Field overrides; `id` required
 * @returns {HitDieRollEntry} Fully-populated entry
 */
const entry = (
  overrides: Partial<HitDieRollEntry> & { id: string },
): HitDieRollEntry => ({
  vocSlug: 'berserker',
  vocTitle: 'Berserker',
  dieType: '12',
  levelIndex: 1,
  result: null,
  conMod: 2,
  addedToHp: false,
  ...overrides,
});

describe('recalculateHpMax', () => {
  it('returns 0 for an empty log', () => {
    expect(recalculateHpMax([])).toBe(0);
  });

  it('counts only entries added to HP, ignoring rolled-but-unadded and unrolled', () => {
    const log = [
      entry({ id: 'a', result: 8, addedToHp: true }),
      entry({ id: 'b', result: 6, addedToHp: false }),
      entry({ id: 'c', result: null, addedToHp: false }),
    ];
    expect(recalculateHpMax(log)).toBe(10);
  });

  it('uses each entry frozen conMod so a later CON change cannot drift the total', () => {
    const log = [
      entry({ id: 'a', result: 8, conMod: 2, addedToHp: true }),
      entry({ id: 'b', result: 5, conMod: 3, addedToHp: true }),
    ];
    expect(recalculateHpMax(log)).toBe(18);
  });

  it('drops phantom HP when a confirmed entry is pruned on level decrease or vocation removal', () => {
    const full = [
      entry({ id: 'a', result: 8, addedToHp: true }),
      entry({ id: 'b', result: 7, addedToHp: true }),
    ];
    expect(recalculateHpMax(full)).toBe(19);
    const pruned = full.filter((e) => e.id !== 'b');
    expect(recalculateHpMax(pruned)).toBe(10);
  });

  it('returns to the pre-add baseline when a confirmed roll is un-added for a re-roll', () => {
    const baseline = [entry({ id: 'a', result: 8, addedToHp: true })];
    expect(recalculateHpMax(baseline)).toBe(10);
    const reRolling = baseline.map((e) => ({
      ...e,
      addedToHp: false,
      result: 11,
    }));
    expect(recalculateHpMax(reRolling)).toBe(0);
  });

  it('never returns a negative maximum', () => {
    const log = [entry({ id: 'a', result: 1, conMod: -3, addedToHp: true })];
    expect(recalculateHpMax(log)).toBe(0);
  });
});
