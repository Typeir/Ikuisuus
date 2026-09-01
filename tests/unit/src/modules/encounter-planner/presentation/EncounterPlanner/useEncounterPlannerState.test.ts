/**
 * @fileoverview Tests for useEncounterPlannerState hook
 * @module tests/unit/src/modules/encounter-planner/presentation/EncounterPlanner/useEncounterPlannerState.test
 */

import { useEncounterPlannerState } from '@/modules/encounter-planner/presentation/EncounterPlanner/useEncounterPlannerState';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/ui', () => ({
  useNotifications: () => ({
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/useDebounce', () => ({
  useDebounce: (v: unknown) => v,
}));

vi.mock(
  '@/modules/encounter-planner/infrastructure/persistence/encounterRepository',
  () => ({
    getEncounters: vi.fn(() => []),
    getActiveEncounter: vi.fn(() => null),
    saveEncounter: vi.fn(),
    deleteEncounter: vi.fn(),
    setActiveEncounterId: vi.fn(),
  }),
);

vi.mock(
  '@/modules/encounter-planner/infrastructure/persistence/encounterImportExport',
  () => ({
    exportEncounter: vi.fn(() => '{}'),
    importEncounter: vi.fn(() => ({
      id: 'imp',
      name: 'Imported',
      creatures: [],
    })),
  }),
);

vi.mock(
  '@/modules/encounter-planner/application/factories/encounter.factory',
  () => ({
    createEmptyEncounter: vi.fn(() => ({
      id: 'new',
      name: 'New Encounter',
      creatures: [],
      createdAt: '',
      updatedAt: '',
    })),
    createEmptyCreature: vi.fn(() => ({ id: 'c1', name: 'Creature' })),
    createMultipleCreaturesFromMonster: vi.fn(() => []),
  }),
);

vi.mock(
  '@/modules/encounter-planner/application/factories/combatSnapshot.factory',
  () => ({
    createInProgressCombat: vi.fn(() => ({
      id: 'cbt1',
      encounterId: 'new',
      combatants: [],
      turnOrder: [],
      roundNumber: 1,
      activeTurnIndex: 0,
    })),
    createInProgressCombatant: vi.fn((c) => c),
    getActiveInProgressCombatId: vi.fn(() => null),
    getInProgressCombat: vi.fn(() => null),
    saveInProgressCombat: vi.fn(),
    setActiveInProgressCombatId: vi.fn(),
  }),
);

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

describe('useEncounterPlannerState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null encounter and empty list', () => {
    const { result } = renderHook(() => useEncounterPlannerState());
    expect(result.current.encounters).toEqual([]);
  });

  it('creates a new encounter on mount when none exist', () => {
    const { result } = renderHook(() => useEncounterPlannerState());
    expect(result.current.encounter).not.toBeNull();
    expect(result.current.encounter?.name).toBe('New Encounter');
  });

  it('handleNewEncounter sets a fresh encounter', () => {
    const { result } = renderHook(() => useEncounterPlannerState());
    act(() => {
      result.current.handleNewEncounter();
    });
    expect(result.current.encounter?.id).toBe('new');
  });

  it('handleExitPlayMode clears inProgressCombat', () => {
    const { result } = renderHook(() => useEncounterPlannerState());
    act(() => {
      result.current.setInProgressCombat({
        id: 'cbt',
        encounterId: 'enc',
        encounterName: 'E',
        createdAt: '',
        startedAt: '',
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      });
    });
    act(() => {
      result.current.handleExitPlayMode();
    });
    expect(result.current.inProgressCombat).toBeNull();
  });
});
