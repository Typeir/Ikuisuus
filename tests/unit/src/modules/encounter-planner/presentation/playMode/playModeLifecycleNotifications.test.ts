/**
 * @fileoverview Unit tests for Play Mode lifecycle notification subscriptions.
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/playModeLifecycleNotifications.test
 * @description Verifies round-start lair warnings and legendary deed reminders.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { PlayModeLifecycle } from '@/modules/encounter-planner/playMode/playModeLifecycle';
import { usePlayModeLifecycleNotifications } from '@/modules/encounter-planner/playMode/playModeLifecycleNotifications';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { renderHook } from '@testing-library/react';
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
 * Creates a mock combat object for lifecycle payloads.
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

describe('usePlayModeLifecycleNotifications', () => {
  it('should warn on round end when lair creature still has deeds available', () => {
    const lifecycle = new PlayModeLifecycle();
    const notifications = {
      info: vi.fn(() => 'id-info'),
      warning: vi.fn(() => 'id-warning'),
    };
    const t = (key: string, values?: Record<string, string | number>) =>
      values && Object.keys(values).length > 0
        ? `${Object.values(values).join(' ')} ${key}`
        : key;

    renderHook(() =>
      usePlayModeLifecycleNotifications({ lifecycle, notifications, t }),
    );

    lifecycle.emit('roundEnd', {
      previousCombat: createCombat({
        roundNumber: 2,
        combatants: [
          createCombatant({
            id: 'lair-1',
            name: 'Mucklord',
            mechanics: {
              lair: true,
              stratagem: false,
              legendaryDeed: false,
              resist: false,
              phase: false,
            },
            legendaryDeedsUsed: [false, true],
          }),
        ],
      }),
      nextCombat: createCombat({ roundNumber: 3 }),
      roundNumber: 2,
    });

    expect(notifications.warning).toHaveBeenCalledWith(
      expect.stringContaining('Mucklord'),
      expect.objectContaining({ title: 'lairAlertTitle' }),
    );
  });

  it('should warn on round start when lair creature has deeds available', () => {
    const lifecycle = new PlayModeLifecycle();
    const notifications = {
      info: vi.fn(() => 'id-info'),
      warning: vi.fn(() => 'id-warning'),
    };
    const t = (key: string, values?: Record<string, string | number>) =>
      values && Object.keys(values).length > 0
        ? `${Object.values(values).join(' ')} ${key}`
        : key;

    renderHook(() =>
      usePlayModeLifecycleNotifications({ lifecycle, notifications, t }),
    );

    lifecycle.emit('roundStart', {
      previousCombat: createCombat({ roundNumber: 1 }),
      nextCombat: createCombat({
        combatants: [
          createCombatant({
            id: 'lair-1',
            name: 'Lair Tyrant',
            mechanics: {
              lair: true,
              stratagem: false,
              legendaryDeed: false,
              resist: false,
              phase: false,
            },
            legendaryDeedsUsed: [true, false],
          }),
        ],
      }),
      roundNumber: 2,
    });

    expect(notifications.warning).toHaveBeenCalledWith(
      expect.stringContaining('Lair Tyrant'),
      expect.objectContaining({ title: 'lairAlertTitle' }),
    );
  });

  it('should notify on turn start when combatant has stratagem', () => {
    const lifecycle = new PlayModeLifecycle();
    const notifications = {
      info: vi.fn(() => 'id-info'),
      warning: vi.fn(() => 'id-warning'),
    };
    const t = (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${values.name} ${key}` : key;

    renderHook(() =>
      usePlayModeLifecycleNotifications({ lifecycle, notifications, t }),
    );

    lifecycle.emit('turnStart', {
      previousCombat: createCombat(),
      nextCombat: createCombat(),
      combatantId: 'mucklord',
      combatant: createCombatant({
        id: 'mucklord',
        name: 'Mucklord',
        mechanics: {
          lair: false,
          stratagem: true,
          legendaryDeed: false,
          resist: false,
          phase: false,
        },
      }),
    });

    expect(notifications.info).toHaveBeenCalledWith(
      expect.stringContaining('Mucklord'),
      expect.objectContaining({ title: 'stratagem' }),
    );
  });

  it('should notify on turn end when ending combatant has stratagem', () => {
    const lifecycle = new PlayModeLifecycle();
    const notifications = {
      info: vi.fn(() => 'id-info'),
      warning: vi.fn(() => 'id-warning'),
    };
    const t = (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${values.name} ${key}` : key;

    renderHook(() =>
      usePlayModeLifecycleNotifications({ lifecycle, notifications, t }),
    );

    lifecycle.emit('turnEnd', {
      previousCombat: createCombat({
        combatants: [
          createCombatant({
            id: 'mucklord',
            name: 'Mucklord',
            mechanics: {
              lair: false,
              stratagem: true,
              legendaryDeed: false,
              resist: false,
              phase: false,
            },
          }),
        ],
        turnOrder: ['mucklord'],
      }),
      nextCombat: createCombat(),
      endingCombatantId: 'mucklord',
      startingCombatantId: 'other',
      previousRoundNumber: 1,
      nextRoundNumber: 1,
    });

    expect(notifications.info).toHaveBeenCalledWith(
      expect.stringContaining('Mucklord'),
      expect.objectContaining({ title: 'stratagem' }),
    );
  });

  it('should send creature-specific reminder on turn end', () => {
    const lifecycle = new PlayModeLifecycle();
    const notifications = {
      info: vi.fn(() => 'id-info'),
      warning: vi.fn(() => 'id-warning'),
    };
    const t = (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${values.name} ${key}` : key;

    renderHook(() =>
      usePlayModeLifecycleNotifications({ lifecycle, notifications, t }),
    );

    lifecycle.emit('turnEnd', {
      previousCombat: createCombat(),
      nextCombat: createCombat({
        combatants: [
          createCombatant({
            id: 'active',
            name: 'Active',
            mechanics: {
              lair: false,
              stratagem: false,
              legendaryDeed: true,
              resist: false,
              phase: false,
            },
            legendaryDeedsUsed: [false],
          }),
          createCombatant({
            id: 'legendary',
            name: 'Ancient Dragon',
            mechanics: {
              lair: false,
              stratagem: false,
              legendaryDeed: true,
              resist: false,
              phase: false,
            },
            legendaryDeedsUsed: [true, false],
          }),
        ],
      }),
      endingCombatantId: 'active',
      startingCombatantId: 'active',
      previousRoundNumber: 1,
      nextRoundNumber: 1,
    });

    expect(notifications.info).toHaveBeenCalledWith(
      expect.stringContaining('Ancient Dragon'),
      expect.objectContaining({ title: 'legendaryDeeds' }),
    );
  });
});
