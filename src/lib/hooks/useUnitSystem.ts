/**
 * Unit System State Hooks
 *
 * @fileoverview React hooks for the unit display preferences and their actions.
 *
 * Preferences are read from persistent storage during render, which the server
 * cannot do. These hooks therefore report the native system until after the
 * first client render, so server markup and first paint agree and hydration
 * has nothing to reconcile.
 *
 * `PersistentUiState.isHydrated` cannot serve that purpose: the provider sets
 * it true in its initial state, so it is already true on the very first render.
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
 * Returns the native defaults until the first client render has committed,
 * which keeps server and client markup identical through hydration.
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
