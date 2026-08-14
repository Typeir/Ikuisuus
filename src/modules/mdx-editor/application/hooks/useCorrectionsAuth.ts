/**
 * Corrections Auth Hook
 *
 * @fileoverview React hook for session-based authentication in the corrections module.
 * Session token is stored in PersistentUiState.
 *
 * @module lib/hooks/useCorrectionsAuth
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

'use client';

import {
    usePersistentUiDispatch,
    usePersistentUiState,
} from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import type { AuthUser } from '@/modules/mdx-editor/domain/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * State returned by useCorrectionsAuth.
 *
 * @property {string | null} token - Session token (null when logged out)
 * @property {AuthUser | null} user - Logged-in user info
 * @property {boolean} isHydrated - Whether persistent state has been hydrated
 * @property {boolean} isLoggingIn - Whether a login request is in flight
 * @property {string | null} error - Last auth error message
 */
export interface CorrectionsAuthState {
  /** Session token (null when logged out) */
  token: string | null;
  /** Logged-in user info */
  user: AuthUser | null;
  /** Whether persistent state has been hydrated */
  isHydrated: boolean;
  /** Whether a login request is in flight */
  isLoggingIn: boolean;
  /** Last auth error message */
  error: string | null;
}

/**
 * Actions returned by useCorrectionsAuth.
 *
 * @property {(username: string, password: string) => Promise<boolean>} login - Authenticate
 * @property {() => void} logout - Clear session
 * @property {() => void} clearError - Dismiss error message
 */
export interface CorrectionsAuthActions {
  /** Authenticate with username + password */
  login: (username: string, password: string) => Promise<boolean>;
  /** Clear session */
  logout: () => void;
  /** Dismiss error message */
  clearError: () => void;
}

/**
 * Hook that manages corrections module authentication.
 * Validates a stored token on mount. Provides login/logout actions.
 *
 * @returns {CorrectionsAuthState & CorrectionsAuthActions} Auth state and actions
 */
export function useCorrectionsAuth(): CorrectionsAuthState &
  CorrectionsAuthActions {
  const state = usePersistentUiState();
  const dispatch = usePersistentUiDispatch();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  const storedToken = state.correctionsToken;
  const isHydrated = state.isHydrated;

  /** Persist session token to unified storage. */
  const persistToken = useCallback(
    (token: string | null) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN,
        payload: { token },
      });
    },
    [dispatch],
  );

  /** Validate stored token on hydration. */
  useEffect(() => {
    if (!isHydrated || validated || !storedToken) return;
    setValidated(true);

    fetch('/api/auth/validate', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.session) {
          setUser({
            id: data.session.userId,
            username: data.session.username,
            role: data.session.role,
          });
        } else {
          /** Token is stale — clear it */
          persistToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        /** Network error — keep token, user can retry */
      });
  }, [isHydrated, storedToken, validated, persistToken]);

  /** Login action. */
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoggingIn(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
          return false;
        }

        persistToken(data.token);
        setUser(data.user);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
        return false;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [persistToken],
  );

  /** Logout action. */
  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
    setError(null);
    setValidated(false);
  }, [persistToken]);

  /** Clear error. */
  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      token: storedToken,
      user,
      isHydrated,
      isLoggingIn,
      error,
      login,
      logout,
      clearError,
    }),
    [
      storedToken,
      user,
      isHydrated,
      isLoggingIn,
      error,
      login,
      logout,
      clearError,
    ],
  );
}
