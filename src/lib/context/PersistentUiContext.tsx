/**
 * Persistent UI Context and Provider
 *
 * @fileoverview React Context for persistent UI state (theme, unit system,
 * sidebar). Exports provider and access hooks.
 *
 * @module lib/context/PersistentUiContext
 * @version 2.2.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { JSX } from 'react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { persistentUiReducer } from '../reducers/persistentUiReducer';
import {
  DEFAULT_PERSISTENT_UI_STATE,
  PersistentUiAction,
  PersistentUiState,
} from '../types/persistentUiState';
import {
  readPersistedState,
  writePersistedState,
} from './persistentUiStorage';
import { useIkUiHandle } from './useIkUiHandle';

/**
 * State context value shape
 * @interface PersistentUiStateContextValue
 * @property {PersistentUiState} state - Current persistent UI state
 */
interface PersistentUiStateContextValue {
  state: PersistentUiState;
}

/**
 * Dispatch context value shape
 * @interface PersistentUiDispatchContextValue
 * @property {(action: PersistentUiAction) => void} dispatch - Action dispatcher
 */
interface PersistentUiDispatchContextValue {
  dispatch: (action: PersistentUiAction) => void;
}

const PersistentUiStateContext =
  createContext<PersistentUiStateContextValue | null>(null);
const PersistentUiDispatchContext =
  createContext<PersistentUiDispatchContextValue | null>(null);

/**
 * Props for PersistentUiProvider
 *
 * @interface PersistentUiProviderProps
 * @property {ReactNode} children - Child components to render
 * @property {string[]} initialExpandedPaths - Server-read expanded paths for SSR hydration match
 */
interface PersistentUiProviderProps {
  children: ReactNode;
  initialExpandedPaths: string[];
}

/**
 * Provider component for persistent UI state
 *
 * @component
 * @param {PersistentUiProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to render
 * @param {string[]} props.initialExpandedPaths - Server-read expanded paths for SSR hydration match
 * @returns {JSX.Element} Context providers wrapping children
 *
 * @description Uses server-provided initialExpandedPaths to prevent hydration
 * mismatch.
 */
export function PersistentUiProvider({
  children,
  initialExpandedPaths,
}: PersistentUiProviderProps): JSX.Element {
  const persistedState = readPersistedState(initialExpandedPaths);

  const initialState: PersistentUiState = {
    ...DEFAULT_PERSISTENT_UI_STATE,
    ...persistedState,
    sidebarMenu: {
      ...DEFAULT_PERSISTENT_UI_STATE.sidebarMenu,
      ...persistedState.sidebarMenu,
    },
    isHydrated: true,
  };

  const [state, dispatch] = useReducer(persistentUiReducer, initialState);

  useIkUiHandle(state, dispatch);

  useEffect(() => {
    writePersistedState(state);
  }, [state]);

  const stateValue = useMemo<PersistentUiStateContextValue>(
    () => ({ state }),
    [state],
  );
  const dispatchValue = useMemo<PersistentUiDispatchContextValue>(
    () => ({ dispatch }),
    [],
  );

  return (
    <PersistentUiStateContext.Provider value={stateValue}>
      <PersistentUiDispatchContext.Provider value={dispatchValue}>
        {children}
      </PersistentUiDispatchContext.Provider>
    </PersistentUiStateContext.Provider>
  );
}

/**
 * Hook to access raw persistent UI state
 */
export function usePersistentUiState(): PersistentUiState {
  const context = useContext(PersistentUiStateContext);
  if (!context) {
    throw new Error(
      'usePersistentUiState must be used within a PersistentUiProvider',
    );
  }
  return context.state;
}

/**
 * Hook to access persistent UI state without requiring a provider.
 *
 * Returns the default state when no provider is present.
 *
 * @returns {PersistentUiState} Provider state, or the unhydrated defaults
 */
export function usePersistentUiStateOptional(): PersistentUiState {
  const context = useContext(PersistentUiStateContext);
  return context?.state ?? DEFAULT_PERSISTENT_UI_STATE;
}

/**
 * Hook to access dispatch function
 */
export function usePersistentUiDispatch(): (
  action: PersistentUiAction,
) => void {
  const context = useContext(PersistentUiDispatchContext);
  if (!context) {
    throw new Error(
      'usePersistentUiDispatch must be used within a PersistentUiProvider',
    );
  }
  return context.dispatch;
}

/**
 * Hook to access dispatch without requiring a provider.
 *
 * Returns null when no provider is present.
 *
 * @returns {((action: PersistentUiAction) => void) | null} Dispatch, or null with no provider
 */
export function usePersistentUiDispatchOptional():
  | ((action: PersistentUiAction) => void)
  | null {
  const context = useContext(PersistentUiDispatchContext);
  return context?.dispatch ?? null;
}

export { useSidebarExpansion as useSidebarExpansionActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
export { useSidebarMenuActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenuActions';
export { useSidebarMenu as useSidebarMenuState } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenu';
export type { SidebarExpansionActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
export type { SidebarMenuActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenuActions';

export { useThemeActions, useThemeState } from '../hooks/useThemeState';
export type { ThemeActions, ThemeState } from '../hooks/useThemeState';

export {
  useDisplayPrefsActions,
  useDisplayPrefsState,
} from '../hooks/useDisplayPrefs';
export type {
  DisplayPrefsActions,
  DisplayPrefsState,
} from '../hooks/useDisplayPrefs';

export {
  useCorrectionsTokenActions,
  useCorrectionsTokenState,
} from '../../modules/mdx-editor/application/hooks/useCorrectionsToken';
export type {
  CorrectionsTokenActions,
  CorrectionsTokenState,
} from '../../modules/mdx-editor/application/hooks/useCorrectionsToken';
