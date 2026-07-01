/**
 * @fileoverview Tests for heroicAwakeningApply
 * @description Validates fate die rolling, tier progression, affix assignment,
 * and combatant mutation for the Heroic Awakening system.
 */

import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { applyHeroicAwakening } from '@/modules/encounter-planner/domain/heroic/heroicAwakeningApply';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Build a minimal combatant fixture suitable for heroic awakening.
 *
 * @param overrides - Partial overrides for the combatant
 * @returns Well-formed InProgressCombatant
 */
function makeCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'test-creature',
    name: 'Test Monster',
    hpCurrent: 50,
    hpMax: 50,
    hpMaxOverride: 50,
    tempHp: null,
    ac: 15,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    conditions: [],
    initiativeValue: 12,
    initiativeBonus: 2,
    tierBonus: 3,
    tierBonusOverride: null,
    speed: '30 ft.',
    hpFormula: '6d10+12',
    details: { buffs: [], items: [], spells: [], affixes: [] },
    slain: false,
    sessionOnly: false,
    heroicAwakening: {
      fateDieResult: 0,
      heroicDc: 0,
      awakened: false,
      tier: 'none',
      affixes: [],
      bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
      hpOverride: null,
    },
    mechanics: {
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    },
    legendaryDeedsUsed: [],
    resistRemaining: 0,
    phaseDeeds: { wounded: false, bloodied: false, doomed: false },
    ...overrides,
  };
}

/**
 * Mock Math.random to produce a high fate die (d20 = 20, passes any DC)
 * followed by safe affix rolls (d10 = 6, never hits "Reroll").
 * Using a flat 0.99 would cause an infinite Reroll loop because
 * rollAffix() would always return 10 which maps to "Reroll".
 */
function mockHighRolls(): void {
  vi.spyOn(Math, 'random')
    .mockReturnValueOnce(0.99)
    .mockReturnValue(0.5);
}

/**
 * Mock Math.random to produce a low fate die (d20 = 1, fails any DC).
 */
function mockLowRolls(): void {
  vi.spyOn(Math, 'random').mockReturnValue(0.01);
}

describe('applyHeroicAwakening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set tier to none when crText is not provided', () => {
    const combatant = makeCombatant();

    applyHeroicAwakening(combatant);

    expect(combatant.heroicAwakening.tier).toBe('none');
  });

  it('should set tier to none when crText is empty string', () => {
    const combatant = makeCombatant();

    applyHeroicAwakening(combatant, '');

    expect(combatant.heroicAwakening.tier).toBe('none');
  });

  it('should record fateDieResult and heroicDc on the combatant', () => {
    mockHighRolls();

    const combatant = makeCombatant();

    applyHeroicAwakening(combatant, 'CR 5');

    expect(combatant.heroicAwakening.fateDieResult).toBeGreaterThan(0);
    expect(combatant.heroicAwakening.heroicDc).toBeGreaterThan(0);
  });

  it('should set awakened=false when fate die rolls below DC', () => {
    mockLowRolls();

    const combatant = makeCombatant();

    applyHeroicAwakening(combatant, 'CR 10');

    expect(combatant.heroicAwakening.awakened).toBe(false);
    expect(combatant.heroicAwakening.tier).toBe('none');
  });

  it('should awaken combatant when fate die meets DC', () => {
    mockHighRolls();

    const combatant = makeCombatant();

    applyHeroicAwakening(combatant, 'CR 5');

    expect(combatant.heroicAwakening.awakened).toBe(true);
    expect(['awakened', 'legendary', 'mythic']).toContain(
      combatant.heroicAwakening.tier,
    );
  });

  it('should apply AC bonus when awakened', () => {
    mockHighRolls();

    const combatant = makeCombatant({ ac: 15 });

    applyHeroicAwakening(combatant, 'CR 5');

    if (combatant.heroicAwakening.awakened) {
      expect(combatant.ac).toBeGreaterThan(15);
    }
  });

  it('should populate affixes array when awakened', () => {
    mockHighRolls();

    const combatant = makeCombatant();

    applyHeroicAwakening(combatant, 'CR 5');

    if (combatant.heroicAwakening.awakened) {
      expect(combatant.heroicAwakening.affixes.length).toBeGreaterThan(0);
      expect(combatant.heroicAwakening.affixes.length).toBeLessThanOrEqual(3);
    }
  });

  it('should set tierBonusOverride when awakened', () => {
    mockHighRolls();

    const combatant = makeCombatant({ tierBonus: 2 });

    applyHeroicAwakening(combatant, 'CR 5');

    if (
      combatant.heroicAwakening.awakened &&
      combatant.tierBonus !== null
    ) {
      expect(combatant.tierBonusOverride).toBeGreaterThan(
        combatant.tierBonus,
      );
    }
  });
});
