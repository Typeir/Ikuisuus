/**
 * Theme State Hooks
 *
 * @fileoverview React hooks for theme state and actions.
 * Provides access to current theme value and toggle functionality.
 *
 * @module lib/hooks/useThemeState
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
    usePersistentUiDispatch,
    usePersistentUiState,
} from '../context/PersistentUiContext';
import {
    PERSISTED_UI_ACTION_TYPES,
    ThemeValue,
} from '../types/persistentUiState';

/**
 * Theme state
 *
 * @interface ThemeState
 * @property {ThemeValue} theme - Current theme value
 * @property {boolean} isHydrated - Whether state has been hydrated
 */
export interface ThemeState {
  theme: ThemeValue;
  isHydrated: boolean;
}

/**
 * Hook to access theme state
 *
 * @function useThemeState
 * @returns {ThemeState} Theme state with hydration flag
 */
export function useThemeState(): ThemeState {
  const state = usePersistentUiState();
  return {
    theme: state.theme,
    isHydrated: state.isHydrated,
  };
}

/**
 * Theme action helpers
 *
 * @interface ThemeActions
 * @property {(theme: ThemeValue) => void} setTheme - Set theme value
 * @property {() => void} toggleTheme - Toggle between dark and light
 */
export interface ThemeActions {
  setTheme: (theme: ThemeValue) => void;
  toggleTheme: () => void;
}

/**
 * Hook to access theme actions
 *
 * @function useThemeActions
 * @returns {ThemeActions} Action functions for theme control
 */
export function useThemeActions(): ThemeActions {
  const dispatch = usePersistentUiDispatch();
  const { theme } = useThemeState();

  const setTheme = useCallback(
    (newTheme: ThemeValue) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
        payload: { theme: newTheme },
      });
    },
    [dispatch]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch({
      type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
      payload: { theme: newTheme },
    });
  }, [dispatch, theme]);

  return useMemo(() => ({ setTheme, toggleTheme }), [setTheme, toggleTheme]);
}
