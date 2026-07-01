/**
 * @fileoverview Unit tests for Play Mode turn transition helpers.
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/playModeTurnFlow.test
 * @description Verifies event ordering and round/deed transition behavior.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { buildEndTurnTransition } from '@/modules/encounter-planner/application/lifecycle/playModeTurnFlow';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { describe, expect, it } from 'vitest';

/**
 * Creates a mock combatant with optional overrides.
 *
 * @param {Partial<InProgressCombatant>} [overrides] - Overridden combatant fields
 * @returns {InProgressCombatant} Mock combatant
 */
function createCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'combatant-1',
    name: 'Combatant',
    hpCurrent: 10,
    hpMax: 10,
    hpMaxOverride: null,
    tempHp: null,
    ac: 10,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    conditions: [],
    initiativeValue: 10,
    initiativeBonus: 0,
    tierBonus: null,
    tierBonusOverride: null,
    speed: null,
    hpFormula: null,
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
 * Creates a mock in-progress combat state.
 *
 * @param {Partial<InProgressCombat>} [overrides] - Overridden combat fields
 * @returns {InProgressCombat} Mock combat
 */
function createCombat(
  overrides: Partial<InProgressCombat> = {},
): InProgressCombat {
  const a = createCombatant({
    id: 'a',
    name: 'A',
    legendaryDeedsUsed: [true, false],
  });
  const b = createCombatant({
    id: 'b',
    name: 'B',
    legendaryDeedsUsed: [true, true],
  });
  return {
    id: 'combat-1',
    encounterId: 'encounter-1',
    encounterName: 'Encounter',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    combatants: [a, b],
    turnOrder: ['a', 'b'],
    activeTurnIndex: 0,
    roundNumber: 1,
    ...overrides,
  };
}

describe('buildEndTurnTransition', () => {
  it('should emit ordered turn events without round events when not wrapping', () => {
    const previousCombat = createCombat({ activeTurnIndex: 0, roundNumber: 1 });
    const result = buildEndTurnTransition(previousCombat, () => 1);

    expect(result.nextCombat.activeTurnIndex).toBe(1);
    expect(result.nextCombat.roundNumber).toBe(1);
    expect(result.nextCombat.combatants[1].legendaryDeedsUsed).toEqual([
      false,
      false,
    ]);
    expect(result.lifecycleEvents.map((event) => event.eventName)).toEqual([
      'turnEnd',
      'turnStart',
    ]);
  });

  it('should emit round end/start between turn events when wrapping', () => {
    const previousCombat = createCombat({ activeTurnIndex: 1, roundNumber: 2 });
    const result = buildEndTurnTransition(previousCombat, () => 0);

    expect(result.nextCombat.activeTurnIndex).toBe(0);
    expect(result.nextCombat.roundNumber).toBe(3);
    expect(result.lifecycleEvents.map((event) => event.eventName)).toEqual([
      'turnEnd',
      'roundEnd',
      'roundStart',
      'turnStart',
    ]);

    const turnEndEvent = result.lifecycleEvents.find(
      (event) => event.eventName === 'turnEnd',
    );
    const turnStartEvent = result.lifecycleEvents.find(
      (event) => event.eventName === 'turnStart',
    );

    expect(turnEndEvent?.payload.endingCombatantId).toBe('b');
    expect(turnStartEvent?.payload.combatantId).toBe('a');
  });
});
