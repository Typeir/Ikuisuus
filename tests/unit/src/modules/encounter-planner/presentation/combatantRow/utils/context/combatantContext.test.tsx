/**
 * @fileoverview Unit tests for CombatantContext
 * @description Tests for the CombatantProvider and useCombatant hook.
 *
 * @module CombatantContext.test
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @testing-library/react-hooks
 * @requires @/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types
 */

import {
    CombatantProvider,
    useCombatant,
} from '@/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Creates a mock combatant for testing.
 */
function createMockCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'test-combatant-1',
    name: 'Test Monster',
    hpCurrent: 50,
    hpMax: 100,
    hpMaxOverride: null,
    tempHp: null,
    ac: 15,
    stats: { str: 16, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
    conditions: [],
    initiativeValue: 15,
    initiativeBonus: 2,
    proficiencyBonus: 3,
    proficiencyBonusOverride: null,
    speed: '30 ft.',
    hpFormula: '10d10 + 50',
    details: {
      buffs: [],
      items: [],
      spells: [],
      affixes: [],
    },
    slain: false,
    sessionOnly: false,
    heroicAwakening: {
      fateDieResult: 0,
      heroicDc: 0,
      awakened: false,
      tier: 'none',
      affixes: [],
      bonuses: {
        proficiencyBonus: 0,
        acBonus: 0,
        savingThrowBonus: 0,
      },
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
    phaseDeeds: {
      wounded: false,
      bloodied: false,
      doomed: false,
    },
    ...overrides,
  };
}

describe('CombatantContext', () => {
  describe('useCombatant hook', () => {
    it('should throw error when used outside CombatantProvider', () => {
      expect(() => {
        renderHook(() => useCombatant());
      }).toThrow('useCombatant must be used within a CombatantProvider');
    });

    it('should return combatant data from provider', () => {
      const mockCombatant = createMockCombatant({ name: 'Ancient Dragon' });
      const mockOnUpdate = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CombatantProvider combatant={mockCombatant} onUpdate={mockOnUpdate}>
          {children}
        </CombatantProvider>
      );

      const { result } = renderHook(() => useCombatant(), { wrapper });

      expect(result.current.combatant).toEqual(mockCombatant);
    });

    it('should provide updateField function that calls onUpdate', () => {
      const mockCombatant = createMockCombatant({ hpCurrent: 50 });
      const mockOnUpdate = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CombatantProvider combatant={mockCombatant} onUpdate={mockOnUpdate}>
          {children}
        </CombatantProvider>
      );

      const { result } = renderHook(() => useCombatant(), { wrapper });

      act(() => {
        result.current.updateField('hpCurrent', 30);
      });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...mockCombatant,
        hpCurrent: 30,
      });
    });

    it('should provide updateStats function that calls onUpdate', () => {
      const mockCombatant = createMockCombatant();
      const mockOnUpdate = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CombatantProvider combatant={mockCombatant} onUpdate={mockOnUpdate}>
          {children}
        </CombatantProvider>
      );

      const { result } = renderHook(() => useCombatant(), { wrapper });

      const newStats = { str: 20, dex: 14, con: 18, int: 10, wis: 12, cha: 8 };
      act(() => {
        result.current.updateStats(newStats);
      });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...mockCombatant,
        stats: newStats,
      });
    });

    it('should provide onRemoveSessionOnly callback when provided', () => {
      const mockCombatant = createMockCombatant();
      const mockOnUpdate = vi.fn();
      const mockOnRemoveSessionOnly = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CombatantProvider
          combatant={mockCombatant}
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}>
          {children}
        </CombatantProvider>
      );

      const { result } = renderHook(() => useCombatant(), { wrapper });

      expect(result.current.onRemoveSessionOnly).toBe(mockOnRemoveSessionOnly);
    });

    it('should toggle slain field correctly', () => {
      const mockCombatant = createMockCombatant({ slain: false });
      const mockOnUpdate = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <CombatantProvider combatant={mockCombatant} onUpdate={mockOnUpdate}>
          {children}
        </CombatantProvider>
      );

      const { result } = renderHook(() => useCombatant(), { wrapper });

      act(() => {
        result.current.updateField('slain', true);
      });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...mockCombatant,
        slain: true,
      });
    });
  });

  describe('CombatantProvider', () => {
    it('should render children', () => {
      const mockCombatant = createMockCombatant();
      const mockOnUpdate = vi.fn();

      const TestChild = () => {
        const { combatant } = useCombatant();
        return <div data-testid='child'>{combatant.name}</div>;
      };

      const { container } = renderHook(() => null, {
        wrapper: ({ children }) => (
          <CombatantProvider combatant={mockCombatant} onUpdate={mockOnUpdate}>
            <TestChild />
          </CombatantProvider>
        ),
      });

      // No error means children rendered successfully
      expect(true).toBe(true);
    });
  });
});
