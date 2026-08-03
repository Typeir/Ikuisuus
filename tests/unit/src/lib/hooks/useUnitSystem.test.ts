/**
 * @fileoverview useUnitSystem Hook Unit Tests
 * @description Tests for the unit display preference hooks, covering state
 * exposure, the hydration flag, and action dispatch.
 *
 * @module tests/unit/lib/hooks/useUnitSystem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/hooks/useUnitSystem Hooks under test
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDispatch = vi.fn();
const mockState = {
  unitSystem: {
    distance: 'stride' as 'stride' | 'metric' | 'imperial',
    weight: 'stride' as 'stride' | 'metric' | 'imperial',
    volume: 'stride' as 'stride' | 'metric' | 'imperial',
  },
  isHydrated: true,
};

vi.mock('@/lib/context/PersistentUiContext', () => ({
  usePersistentUiStateOptional: () => mockState,
  usePersistentUiDispatch: () => mockDispatch,
}));

import {
  useUnitSystemActions,
  useUnitSystemFor,
  useUnitSystemState,
} from '@/lib/hooks/useUnitSystem';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';

describe('useUnitSystem', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockState.unitSystem = {
      distance: 'stride',
      weight: 'stride',
      volume: 'stride',
    };
    mockState.isHydrated = true;
  });

  describe('useUnitSystemState', () => {
    it('should expose a preference per measurement family', () => {
      const { result } = renderHook(() => useUnitSystemState());

      expect(result.current.unitSystem).toEqual({
        distance: 'stride',
        weight: 'stride',
        volume: 'stride',
      });
    });

    it('should report hydrated after the first client render', () => {
      const { result } = renderHook(() => useUnitSystemState());
      expect(result.current.isHydrated).toBe(true);
    });

    it('should reflect independent preferences once mounted', () => {
      mockState.unitSystem = {
        distance: 'metric',
        weight: 'imperial',
        volume: 'stride',
      };

      const { result } = renderHook(() => useUnitSystemState());

      expect(result.current.unitSystem.distance).toBe('metric');
      expect(result.current.unitSystem.weight).toBe('imperial');
      expect(result.current.unitSystem.volume).toBe('stride');
    });
  });

  describe('useUnitSystemFor', () => {
    it.each([
      ['distance', 'metric'],
      ['weight', 'imperial'],
      ['volume', 'stride'],
    ] as const)('should resolve the %s preference', (dimension, expected) => {
      mockState.unitSystem = {
        distance: 'metric',
        weight: 'imperial',
        volume: 'stride',
      };

      const { result } = renderHook(() => useUnitSystemFor(dimension));

      expect(result.current).toBe(expected);
    });
  });

  describe('useUnitSystemActions', () => {
    it('should expose a setter', () => {
      const { result } = renderHook(() => useUnitSystemActions());
      expect(typeof result.current.setUnitSystem).toBe('function');
    });

    it('should dispatch SET_UNIT_SYSTEM for one family only', () => {
      const { result } = renderHook(() => useUnitSystemActions());

      result.current.setUnitSystem('weight', 'imperial');

      expect(mockDispatch).toHaveBeenCalledWith({
        type: PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM,
        payload: { dimension: 'weight', system: 'imperial' },
      });
    });

    it.each(['distance', 'weight', 'volume'] as const)(
      'should dispatch for the %s family',
      (dimension) => {
        const { result } = renderHook(() => useUnitSystemActions());

        result.current.setUnitSystem(dimension, 'metric');

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: { dimension, system: 'metric' },
          }),
        );
      },
    );
  });
});
