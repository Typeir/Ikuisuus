/**
 * @fileoverview Unit tests for PlayModeLifecycle event dispatcher.
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/playModeLifecycle.test
 * @description Verifies subscription, unsubscription, event emission, and clear behavior.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { PlayModeLifecycle } from '@/modules/encounter-planner/application/lifecycle/PlayModeLifecycle';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { describe, expect, it, vi } from 'vitest';

/**
 * Creates a minimal in-progress combatant for lifecycle payload tests.
 *
 * @param {Partial<InProgressCombatant>} [overrides] - Fields to override in the default combatant
 * @returns {InProgressCombatant} Mock combatant
 */
function createCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'combatant-1',
    name: 'Test Combatant',
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
 * Creates a minimal in-progress combat for lifecycle payload tests.
 *
 * @param {Partial<InProgressCombat>} [overrides] - Fields to override in the default combat
 * @returns {InProgressCombat} Mock combat state
 */
function createCombat(
  overrides: Partial<InProgressCombat> = {},
): InProgressCombat {
  const combatant = createCombatant();
  return {
    id: 'combat-1',
    encounterId: 'encounter-1',
    encounterName: 'Test Encounter',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    combatants: [combatant],
    turnOrder: [combatant.id],
    activeTurnIndex: 0,
    roundNumber: 1,
    ...overrides,
  };
}

describe('PlayModeLifecycle', () => {
  it('should emit events to subscribers', () => {
    const lifecycle = new PlayModeLifecycle();
    const subscriber = vi.fn();
    const previousCombat = createCombat();
    const nextCombat = createCombat({ roundNumber: 2 });

    lifecycle.on('roundStart', subscriber);
    lifecycle.emit('roundStart', {
      previousCombat,
      nextCombat,
      roundNumber: 2,
    });

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith({
      previousCombat,
      nextCombat,
      roundNumber: 2,
    });
  });

  it('should stop emitting after unsubscribe', () => {
    const lifecycle = new PlayModeLifecycle();
    const subscriber = vi.fn();
    const previousCombat = createCombat();
    const nextCombat = createCombat({ activeTurnIndex: 1 });

    const unsubscribe = lifecycle.on('turnEnd', subscriber);
    unsubscribe();

    lifecycle.emit('turnEnd', {
      previousCombat,
      nextCombat,
      endingCombatantId: 'combatant-1',
      startingCombatantId: 'combatant-2',
      previousRoundNumber: 1,
      nextRoundNumber: 1,
    });

    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should clear all subscribers', () => {
    const lifecycle = new PlayModeLifecycle();
    const roundSubscriber = vi.fn();
    const turnSubscriber = vi.fn();
    const previousCombat = createCombat();
    const nextCombat = createCombat({ roundNumber: 2 });

    lifecycle.on('roundStart', roundSubscriber);
    lifecycle.on('turnStart', turnSubscriber);
    lifecycle.clear();

    lifecycle.emit('roundStart', {
      previousCombat,
      nextCombat,
      roundNumber: 2,
    });
    lifecycle.emit('turnStart', {
      previousCombat,
      nextCombat,
      combatantId: 'combatant-1',
      combatant: createCombatant(),
    });

    expect(roundSubscriber).not.toHaveBeenCalled();
    expect(turnSubscriber).not.toHaveBeenCalled();
  });
});
