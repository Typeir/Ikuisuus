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
  unitSystem: 'stride' as const,
  isHydrated: false,
};

vi.mock('@/lib/context/PersistentUiContext', () => ({
  usePersistentUiState: () => mockState,
  usePersistentUiDispatch: () => mockDispatch,
}));

import {
  useUnitSystemActions,
  useUnitSystemState,
} from '@/lib/hooks/useUnitSystem';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';

describe('useUnitSystem', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockState.unitSystem = 'stride';
    mockState.isHydrated = false;
  });

  describe('useUnitSystemState', () => {
    it('should expose the current unit system', () => {
      const { result } = renderHook(() => useUnitSystemState());
      expect(result.current.unitSystem).toBe('stride');
    });

    it('should expose the hydration flag', () => {
      const { result } = renderHook(() => useUnitSystemState());
      expect(result.current.isHydrated).toBe(false);
    });

    it('should reflect a hydrated preference', () => {
      mockState.unitSystem = 'imperial';
      mockState.isHydrated = true;

      const { result } = renderHook(() => useUnitSystemState());

      expect(result.current.unitSystem).toBe('imperial');
      expect(result.current.isHydrated).toBe(true);
    });
  });

  describe('useUnitSystemActions', () => {
    it('should expose a setter', () => {
      const { result } = renderHook(() => useUnitSystemActions());
      expect(typeof result.current.setUnitSystem).toBe('function');
    });

    it('should dispatch SET_UNIT_SYSTEM with the chosen value', () => {
      const { result } = renderHook(() => useUnitSystemActions());

      result.current.setUnitSystem('metric');

      expect(mockDispatch).toHaveBeenCalledWith({
        type: PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM,
        payload: { unitSystem: 'metric' },
      });
    });

    it.each(['stride', 'metric', 'imperial'] as const)(
      'should dispatch for the %s system',
      (system) => {
        const { result } = renderHook(() => useUnitSystemActions());

        result.current.setUnitSystem(system);

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ payload: { unitSystem: system } }),
        );
      },
    );
  });
});
