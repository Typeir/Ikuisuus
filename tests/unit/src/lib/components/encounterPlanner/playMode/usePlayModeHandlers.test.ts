/**
 * @fileoverview Unit tests for usePlayModeHandlers hook.
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/usePlayModeHandlers.test
 * @description Verifies core handler behavior for session-only combatant flow.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { PlayModeLifecycle } from '@/lib/components/encounterPlanner/playMode/playModeLifecycle';
import { usePlayModeHandlers } from '@/lib/components/encounterPlanner/playMode/usePlayModeHandlers';
import type {
  InProgressCombat,
  InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import * as storage from '@/lib/utils/inProgressCombatStorage';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

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
    proficiencyBonus: null,
    proficiencyBonusOverride: null,
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
    ...overrides,
  };
}

/**
 * Creates a mock combat state.
 *
 * @param {Partial<InProgressCombat>} [overrides] - Overridden combat fields
 * @returns {InProgressCombat} Mock combat
 */
function createCombat(
  overrides: Partial<InProgressCombat> = {},
): InProgressCombat {
  const combatant = createCombatant();
  return {
    id: 'combat-1',
    encounterId: 'encounter-1',
    encounterName: 'Encounter',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    combatants: [combatant],
    turnOrder: [combatant.id],
    activeTurnIndex: 0,
    roundNumber: 1,
    ...overrides,
  };
}

/**
 * Test harness hook that exposes both combat state and Play Mode handlers.
 *
 * @param {InProgressCombat} initialCombat - Initial combat state
 * @returns {ReturnType<typeof usePlayModeHandlers> & {combat: InProgressCombat}} Combined state and handlers
 */
function useHarness(initialCombat: InProgressCombat) {
  const [combat, setCombat] = useState(initialCombat);
  const lifecycle = new PlayModeLifecycle();
  const notifications = { error: vi.fn(() => 'error-id') };
  const t = (key: string) => key;

  const handlers = usePlayModeHandlers({
    combat,
    setCombat,
    locale: 'en',
    onExit: vi.fn(),
    lifecycle,
    notifications,
    t,
  });

  return {
    combat,
    ...handlers,
  };
}

describe('usePlayModeHandlers', () => {
  it('should add session-only combatant and clear input', () => {
    const saveSpy = vi
      .spyOn(storage, 'saveInProgressCombat')
      .mockImplementation(() => {});

    const { result } = renderHook(() => useHarness(createCombat()));

    act(() => {
      result.current.setSessionOnlyName('Custom Ally');
    });

    act(() => {
      result.current.handleAddSessionOnlyCombatant();
    });

    expect(result.current.combat.combatants).toHaveLength(2);
    expect(result.current.combat.combatants[1].name).toBe('Custom Ally');
    expect(result.current.combat.combatants[1].sessionOnly).toBe(true);
    expect(result.current.sessionOnlyName).toBe('');
    expect(saveSpy).toHaveBeenCalled();

    saveSpy.mockRestore();
  });

  it('should emit turn and round lifecycle events when ending turn', () => {
    const emitSpy = vi.spyOn(PlayModeLifecycle.prototype, 'emit');
    const getNextSpy = vi
      .spyOn(storage, 'getNextActiveCombatantIndex')
      .mockReturnValue(0);
    const saveSpy = vi
      .spyOn(storage, 'saveInProgressCombat')
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useHarness(
        createCombat({
          roundNumber: 1,
          activeTurnIndex: 0,
          turnOrder: ['combatant-1'],
          combatants: [
            createCombatant({
              id: 'combatant-1',
              legendaryDeedsUsed: [true],
            }),
          ],
        }),
      ),
    );

    act(() => {
      result.current.handleEndTurn();
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'turnEnd',
      expect.objectContaining({ previousRoundNumber: 1, nextRoundNumber: 2 }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'roundEnd',
      expect.objectContaining({ roundNumber: 1 }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'roundStart',
      expect.objectContaining({ roundNumber: 2 }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'turnStart',
      expect.objectContaining({ combatantId: 'combatant-1' }),
    );

    emitSpy.mockRestore();
    getNextSpy.mockRestore();
    saveSpy.mockRestore();
  });
});
