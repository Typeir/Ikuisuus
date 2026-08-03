/**
 * Unit System State Hooks
 *
 * @fileoverview React hooks for the unit display preference and its actions.
 * Mirrors the theme hooks: state exposes the hydration flag so consumers can
 * render the server-safe default until persisted state is available.
 *
 * @module lib/hooks/useUnitSystem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
  usePersistentUiDispatch,
  usePersistentUiState,
} from '../context/PersistentUiContext';
import {
  PERSISTED_UI_ACTION_TYPES,
  UnitSystemValue,
} from '../types/persistentUiState';

/**
 * Unit system state
 *
 * @interface UnitSystemState
 * @property {UnitSystemValue} unitSystem - Current unit display preference
 * @property {boolean} isHydrated - Whether state has been hydrated from storage
 */
export interface UnitSystemState {
  unitSystem: UnitSystemValue;
  isHydrated: boolean;
}

/**
 * Hook to access unit system state.
 * Consumers must render the native `stride` output while `isHydrated` is false,
 * because the server has no access to the reader's preference.
 *
 * @function useUnitSystemState
 * @returns {UnitSystemState} Unit system state with hydration flag
 */
export function useUnitSystemState(): UnitSystemState {
  const state = usePersistentUiState();
  return {
    unitSystem: state.unitSystem,
    isHydrated: state.isHydrated,
  };
}

/**
 * Unit system action helpers
 *
 * @interface UnitSystemActions
 * @property {(unitSystem: UnitSystemValue) => void} setUnitSystem - Set the display preference
 */
export interface UnitSystemActions {
  setUnitSystem: (unitSystem: UnitSystemValue) => void;
}

/**
 * Hook to access unit system actions
 *
 * @function useUnitSystemActions
 * @returns {UnitSystemActions} Action functions for unit system control
 */
export function useUnitSystemActions(): UnitSystemActions {
  const dispatch = usePersistentUiDispatch();

  const setUnitSystem = useCallback(
    (unitSystem: UnitSystemValue) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM,
        payload: { unitSystem },
      });
    },
    [dispatch],
  );

  return useMemo(() => ({ setUnitSystem }), [setUnitSystem]);
}
