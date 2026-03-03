/**
 * Corrections Token Hooks
 *
 * @fileoverview React hooks for corrections token state and actions.
 * Provides access to HMAC token for the corrections/MDX editor API.
 * Token persists annually in unified storage (cookies → sessionStorage → localStorage).
 *
 * @module lib/hooks/useCorrectionsToken
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
    usePersistentUiDispatch,
    usePersistentUiState,
} from '../context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '../types/persistentUiState';

/**
 * Corrections token state
 *
 * @interface CorrectionsTokenState
 * @property {string | null} token - Current HMAC token (null if not set)
 * @property {boolean} isHydrated - Whether state has been hydrated from storage
 */
export interface CorrectionsTokenState {
  token: string | null;
  isHydrated: boolean;
}

/**
 * Hook to access corrections token state
 *
 * @function useCorrectionsTokenState
 * @returns {CorrectionsTokenState} Token state with hydration flag
 *
 * @example
 * ```tsx
 * const { token, isHydrated } = useCorrectionsTokenState();
 * if (isHydrated && token) {
 *   // Use token for API calls
 * }
 * ```
 */
export function useCorrectionsTokenState(): CorrectionsTokenState {
  const state = usePersistentUiState();
  return {
    token: state.correctionsToken,
    isHydrated: state.isHydrated,
  };
}

/**
 * Corrections token action helpers
 *
 * @interface CorrectionsTokenActions
 * @property {(token: string | null) => void} setToken - Set or clear token
 */
export interface CorrectionsTokenActions {
  setToken: (token: string | null) => void;
}

/**
 * Hook to access corrections token actions
 *
 * @function useCorrectionsTokenActions
 * @returns {CorrectionsTokenActions} Action function for token management
 *
 * @example
 * ```tsx
 * const { setToken } = useCorrectionsTokenActions();
 *
 * // Store token after user pastes it
 * setToken('eyJleHAiOjE3NzI1Njg5MjgsInNjb3BlIjoiY29udGVudDp3cml0ZSJ9...');
 *
 * // Clear token on logout
 * setToken(null);
 * ```
 */
export function useCorrectionsTokenActions(): CorrectionsTokenActions {
  const dispatch = usePersistentUiDispatch();

  const setToken = useCallback(
    (token: string | null) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN,
        payload: { token },
      });
    },
    [dispatch],
  );

  return useMemo(() => ({ setToken }), [setToken]);
}
