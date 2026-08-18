/**
 * Display Preference Hooks
 *
 * @fileoverview React hooks for reader display preferences: text scale,
 * article measure, and constrained hue.
 *
 * @module lib/hooks/useDisplayPrefs
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
  usePersistentUiDispatch,
  usePersistentUiState,
} from '../context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '../types/persistentUiState';

/**
 * Reader display preferences.
 *
 * @interface DisplayPrefsState
 * @property {number} textScale - Multiplier over the shipped base text size
 * @property {number} proseMeasure - Article line length, in characters
 * @property {boolean} constrainedHue - Whether aspect colour collapses to the theme hue
 * @property {boolean} isHydrated - Whether state has been hydrated
 */
export interface DisplayPrefsState {
  textScale: number;
  proseMeasure: number;
  constrainedHue: boolean;
  isHydrated: boolean;
}

/**
 * Hook to access display preferences.
 *
 * @function useDisplayPrefsState
 * @returns {DisplayPrefsState} Display preferences with hydration flag
 */
export function useDisplayPrefsState(): DisplayPrefsState {
  const state = usePersistentUiState();
  return {
    textScale: state.textScale,
    proseMeasure: state.proseMeasure,
    constrainedHue: state.constrainedHue,
    isHydrated: state.isHydrated,
  };
}

/**
 * Display preference action helpers.
 *
 * @interface DisplayPrefsActions
 * @property {(scale: number) => void} setTextScale - Set the text size multiplier
 * @property {(measure: number) => void} setProseMeasure - Set the article measure in characters
 * @property {(constrained: boolean) => void} setConstrainedHue - Set constrained-hue mode
 */
export interface DisplayPrefsActions {
  setTextScale: (scale: number) => void;
  setProseMeasure: (measure: number) => void;
  setConstrainedHue: (constrained: boolean) => void;
}

/**
 * Hook to access display preference actions.
 *
 * @function useDisplayPrefsActions
 * @returns {DisplayPrefsActions} Action functions for display preferences
 */
export function useDisplayPrefsActions(): DisplayPrefsActions {
  const dispatch = usePersistentUiDispatch();

  const setTextScale = useCallback(
    (scale: number) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_TEXT_SCALE,
        payload: { scale },
      });
    },
    [dispatch],
  );

  const setProseMeasure = useCallback(
    (measure: number) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_PROSE_MEASURE,
        payload: { measure },
      });
    },
    [dispatch],
  );

  const setConstrainedHue = useCallback(
    (constrained: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_CONSTRAINED_HUE,
        payload: { constrained },
      });
    },
    [dispatch],
  );

  return useMemo(
    () => ({ setTextScale, setProseMeasure, setConstrainedHue }),
    [setTextScale, setProseMeasure, setConstrainedHue],
  );
}
