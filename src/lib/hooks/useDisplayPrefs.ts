/**
 * Display Preference Hooks
 *
 * @fileoverview React hooks for reader display preferences: text scale,
 * article measure, constrained hue, and the two section decorators.
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
 * @property {boolean} streamText - Whether sections draw their ticker
 * @property {boolean} sectionDecor - Whether sections draw their knotwork frame
 * @property {boolean} isHydrated - Whether state has been hydrated
 */
export interface DisplayPrefsState {
  textScale: number;
  proseMeasure: number;
  constrainedHue: boolean;
  streamText: boolean;
  sectionDecor: boolean;
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
    streamText: state.streamText,
    sectionDecor: state.sectionDecor,
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
 * @property {(enabled: boolean) => void} setStreamText - Draw or drop the section ticker
 * @property {(enabled: boolean) => void} setSectionDecor - Draw or drop the section frames
 */
export interface DisplayPrefsActions {
  setTextScale: (scale: number) => void;
  setProseMeasure: (measure: number) => void;
  setConstrainedHue: (constrained: boolean) => void;
  setStreamText: (enabled: boolean) => void;
  setSectionDecor: (enabled: boolean) => void;
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

  const setStreamText = useCallback(
    (enabled: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_STREAM_TEXT,
        payload: { enabled },
      });
    },
    [dispatch],
  );

  const setSectionDecor = useCallback(
    (enabled: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SECTION_DECOR,
        payload: { enabled },
      });
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      setTextScale,
      setProseMeasure,
      setConstrainedHue,
      setStreamText,
      setSectionDecor,
    }),
    [
      setTextScale,
      setProseMeasure,
      setConstrainedHue,
      setStreamText,
      setSectionDecor,
    ],
  );
}
