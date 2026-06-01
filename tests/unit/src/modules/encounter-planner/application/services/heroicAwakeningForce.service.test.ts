/**
 * @fileoverview Heroic Awakening Force Tests
 * @description Tests for forceHeroicAwakening and forceHeroicAwakeningWithAffixes
 * functions that mutate combatants with tier-based stat bonuses.
 */

import type { AffixEntry } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import {
  forceHeroicAwakening,
  forceHeroicAwakeningWithAffixes,
} from '@/lib/utils/heroicAwakeningForce';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Creates a minimal in-progress combatant for testing.
 */
function createTestCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'test-1',
    name: 'Test Monster',
    hpCurrent: 50,
    hpMax: 50,
    hpMaxOverride: null,
    tempHp: 0,
    ac: 15,
    stats: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
    conditions: [],
    initiativeValue: 10,
    initiativeBonus: 1,
    proficiencyBonus: 3,
    proficiencyBonusOverride: null,
    speed: '30 ft.',
    hpFormula: null,
    details: { buffs: [], items: [], spells: [], affixes: [] },
    slain: false,
    sessionOnly: false,
    sourceHref: '/library/monsters/test',
    crText: 'CR 5',
    heroicAwakening: {
      fateDieResult: 0,
      heroicDc: 0,
      awakened: false,
      tier: 'none',
      affixes: [],
      bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
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
    locked: [],
    ...overrides,
  };
}

describe('forceHeroicAwakening', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply awakened tier bonuses (multiplier 1)', () => {
    const combatant = createTestCombatant();

    forceHeroicAwakening(combatant, 'awakened');

    expect(combatant.heroicAwakening.awakened).toBe(true);
    expect(combatant.heroicAwakening.tier).toBe('awakened');
    expect(combatant.ac).toBe(16);
    expect(combatant.hpMax).toBe(55);
    expect(combatant.heroicAwakening.bonuses.acBonus).toBe(1);
    expect(combatant.heroicAwakening.bonuses.proficiencyBonus).toBe(1);
    expect(combatant.heroicAwakening.bonuses.savingThrowBonus).toBe(1);
    expect(combatant.heroicAwakening.fateDieResult).toBe(10);
    expect(combatant.heroicAwakening.affixes).toHaveLength(1);
  });

  it('should apply legendary tier bonuses (multiplier 2)', () => {
    const combatant = createTestCombatant();

    forceHeroicAwakening(combatant, 'legendary');

    expect(combatant.heroicAwakening.tier).toBe('legendary');
    expect(combatant.ac).toBe(17);
    expect(combatant.hpMax).toBe(60);
    expect(combatant.heroicAwakening.bonuses.acBonus).toBe(2);
    expect(combatant.heroicAwakening.fateDieResult).toBe(15);
    expect(combatant.heroicAwakening.affixes).toHaveLength(2);
  });

  it('should apply mythic tier bonuses (multiplier 3)', () => {
    const combatant = createTestCombatant();

    forceHeroicAwakening(combatant, 'mythic');

    expect(combatant.heroicAwakening.tier).toBe('mythic');
    expect(combatant.ac).toBe(18);
    expect(combatant.hpMax).toBe(65);
    expect(combatant.heroicAwakening.bonuses.acBonus).toBe(3);
    expect(combatant.heroicAwakening.fateDieResult).toBe(20);
    expect(combatant.heroicAwakening.affixes).toHaveLength(3);
  });

  it('should undo previous awakening bonuses before applying new tier', () => {
    const combatant = createTestCombatant();

    forceHeroicAwakening(combatant, 'awakened');
    const acAfterAwakened = combatant.ac;

    forceHeroicAwakening(combatant, 'mythic');

    expect(combatant.ac).toBe(15 + 3);
    expect(combatant.hpMax).toBe(50 + 15);
  });

  it('should set proficiencyBonusOverride when proficiencyBonus exists', () => {
    const combatant = createTestCombatant({ proficiencyBonus: 3 });

    forceHeroicAwakening(combatant, 'awakened');

    expect(combatant.proficiencyBonusOverride).toBe(4);
  });

  it('should do nothing when crText is empty', () => {
    const combatant = createTestCombatant({ crText: '' });

    forceHeroicAwakening(combatant, 'mythic');

    expect(combatant.heroicAwakening.awakened).toBe(false);
    expect(combatant.ac).toBe(15);
  });

  it('should preserve hpOverride from previous awakening', () => {
    const combatant = createTestCombatant();
    combatant.heroicAwakening.hpOverride = 100;

    forceHeroicAwakening(combatant, 'awakened');

    expect(combatant.heroicAwakening.hpOverride).toBe(100);
  });
});

describe('forceHeroicAwakeningWithAffixes', () => {
  const makeAffix = (text: string): AffixEntry => ({
    text,
    source: {
      slug: text.toLowerCase(),
      href: `/en/library/rules/heroic-awakening/${text.toLowerCase()}`,
    },
  });

  it('should apply awakened tier for 1 affix', () => {
    const combatant = createTestCombatant();
    const affixes = [makeAffix('Venomous')];

    forceHeroicAwakeningWithAffixes(combatant, affixes);

    expect(combatant.heroicAwakening.tier).toBe('awakened');
    expect(combatant.heroicAwakening.awakened).toBe(true);
    expect(combatant.heroicAwakening.affixes).toHaveLength(1);
    expect(combatant.heroicAwakening.affixes[0].text).toBe('Venomous');
    expect(combatant.ac).toBe(16);
  });

  it('should apply legendary tier for 2 affixes', () => {
    const combatant = createTestCombatant();
    const affixes = [makeAffix('Venomous'), makeAffix('Arcane')];

    forceHeroicAwakeningWithAffixes(combatant, affixes);

    expect(combatant.heroicAwakening.tier).toBe('legendary');
    expect(combatant.heroicAwakening.affixes).toHaveLength(2);
    expect(combatant.ac).toBe(17);
  });

  it('should apply mythic tier for 3 or more affixes', () => {
    const combatant = createTestCombatant();
    const affixes = [makeAffix('V'), makeAffix('A'), makeAffix('F')];

    forceHeroicAwakeningWithAffixes(combatant, affixes);

    expect(combatant.heroicAwakening.tier).toBe('mythic');
    expect(combatant.heroicAwakening.affixes).toHaveLength(3);
    expect(combatant.ac).toBe(18);
  });

  it('should remove awakening when 0 affixes provided', () => {
    const combatant = createTestCombatant();
    forceHeroicAwakeningWithAffixes(combatant, [makeAffix('V')]);

    forceHeroicAwakeningWithAffixes(combatant, []);

    expect(combatant.heroicAwakening.awakened).toBe(false);
    expect(combatant.heroicAwakening.tier).toBe('none');
    expect(combatant.heroicAwakening.affixes).toEqual([]);
    expect(combatant.ac).toBe(15);
  });

  it('should do nothing when crText is empty', () => {
    const combatant = createTestCombatant({ crText: '' });
    const affixes = [makeAffix('V')];

    forceHeroicAwakeningWithAffixes(combatant, affixes);

    expect(combatant.heroicAwakening.awakened).toBe(false);
  });

  it('should undo previous awakening bonuses before applying new affixes', () => {
    const combatant = createTestCombatant();
    forceHeroicAwakeningWithAffixes(combatant, [
      makeAffix('V'),
      makeAffix('A'),
    ]);

    forceHeroicAwakeningWithAffixes(combatant, [makeAffix('V')]);

    expect(combatant.ac).toBe(16);
    expect(combatant.heroicAwakening.tier).toBe('awakened');
  });
});
