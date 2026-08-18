/**
 * @fileoverview Register window.ik.ui handle.
 * @description Persistent UI preferences with live getters and validated setters.
 *
 * @module lib/context/useIkUiHandle
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { type Dispatch, useEffect, useRef } from 'react';
import { registerIkModule, unregisterIkModule } from '../debug/ik';
import {
  ASPECT_DISPLAY_MODES,
  PERSISTED_UI_ACTION_TYPES,
  type PersistentUiAction,
  type PersistentUiState,
} from '../types/persistentUiState';

/**
 * Registers `window.ik.ui` for the lifetime of the calling provider.
 *
 * @param {PersistentUiState} state - Current state (read live through a ref)
 * @param {Dispatch<PersistentUiAction>} dispatch - Reducer dispatch
 */
export function useIkUiHandle(
  state: PersistentUiState,
  dispatch: Dispatch<PersistentUiAction>,
): void {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    registerIkModule('ui', {
      get aspectDisplay() {
        return stateRef.current.aspectDisplay;
      },
      set aspectDisplay(display) {
        if (!ASPECT_DISPLAY_MODES.includes(display)) return;
        dispatch({
          type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_DISPLAY,
          payload: { display },
        });
      },
      get aspectExpanded() {
        return stateRef.current.aspectExpanded;
      },
      set aspectExpanded(expanded) {
        dispatch({
          type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED,
          payload: { expanded: Boolean(expanded) },
        });
      },
      get theme() {
        return stateRef.current.theme;
      },
      set theme(theme) {
        if (theme !== 'dark' && theme !== 'light') return;
        dispatch({
          type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
          payload: { theme },
        });
      },
    });
    return () => unregisterIkModule('ui');
  }, [dispatch]);
}
