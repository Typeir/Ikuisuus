/**
 * @fileoverview window.ik.ui handle
 * @description Registers the persistent UI preferences on the `window.ik`
 * debug namespace while the provider is mounted: live getters, validated
 * setters that dispatch and persist. Lets DevTools flip preferences that have
 * no on-page control (aspect display mode).
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
