/**
 * @fileoverview React hooks for unit display preferences and their actions.
 * Returns the native system until the first client render commits, matching
 * server markup for hydration. Reports `isHydrated`, not
 * `PersistentUiState.isHydrated`, which the provider sets true on first render.
 *
 * @module lib/hooks/useUnitSystem
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-03
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  usePersistentUiDispatch,
  usePersistentUiStateOptional,
} from '../context/PersistentUiContext';
import {
  DEFAULT_UNIT_SYSTEM,
  PERSISTED_UI_ACTION_TYPES,
  UnitDimension,
  UnitSystemPreferences,
  UnitSystemValue,
} from '../types/persistentUiState';

/**
 * Unit system state.
 *
 * @interface UnitSystemState
 * @property {UnitSystemPreferences} unitSystem - Display preference per family
 * @property {boolean} isHydrated - Whether the client has completed its first render
 */
export interface UnitSystemState {
  unitSystem: UnitSystemPreferences;
  isHydrated: boolean;
}

/**
 * Hook to access unit display preferences.
 *
 * Returns native defaults until the first client render commits.
 *
 * @function useUnitSystemState
 * @returns {UnitSystemState} Preferences with a hydration flag
 */
export function useUnitSystemState(): UnitSystemState {
  const state = usePersistentUiStateOptional();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    unitSystem: mounted ? state.unitSystem : DEFAULT_UNIT_SYSTEM,
    isHydrated: mounted,
  };
}

/**
 * Resolves the preference governing a single measurement family.
 *
 * @function useUnitSystemFor
 * @param {UnitDimension} dimension - The measurement family
 * @returns {UnitSystemValue} The system to render in
 */
export function useUnitSystemFor(dimension: UnitDimension): UnitSystemValue {
  const { unitSystem } = useUnitSystemState();
  return unitSystem[dimension];
}

/**
 * Unit system action helpers.
 *
 * @interface UnitSystemActions
 * @property {(dimension: UnitDimension, system: UnitSystemValue) => void} setUnitSystem
 *   Sets the preference for one measurement family
 */
export interface UnitSystemActions {
  setUnitSystem: (
    dimension: UnitDimension,
    system: UnitSystemValue,
  ) => void;
}

/**
 * Hook to access unit system actions.
 *
 * @function useUnitSystemActions
 * @returns {UnitSystemActions} Action functions for unit system control
 */
export function useUnitSystemActions(): UnitSystemActions {
  const dispatch = usePersistentUiDispatch();

  const setUnitSystem = useCallback(
    (dimension: UnitDimension, system: UnitSystemValue) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM,
        payload: { dimension, system },
      });
    },
    [dispatch],
  );

  return useMemo(() => ({ setUnitSystem }), [setUnitSystem]);
}
