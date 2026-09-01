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
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
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

/**
 * Subscription surface behind `usePersistentUiSelector`. Stable for the
 * provider's lifetime, so holding it in context never re-renders consumers.
 *
 * @interface PersistentUiStore
 * @property {(listener: () => void) => () => void} subscribe - Registers a change listener; returns the unsubscribe
 * @property {() => PersistentUiState} getSnapshot - Latest reducer state
 */
interface PersistentUiStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PersistentUiState;
}

const PersistentUiStateContext =
  createContext<PersistentUiStateContextValue | null>(null);
const PersistentUiDispatchContext =
  createContext<PersistentUiDispatchContextValue | null>(null);
const PersistentUiStoreContext = createContext<PersistentUiStore | null>(null);

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
 * mismatch. The selector snapshot ref is written during render rather than in
 * an effect so a consumer rendering in the same commit as a dispatch reads
 * the new state; deferred one commit, a row mirroring expansion into local
 * state would see a stale snapshot and revert its own toggle.
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
  const snapshotRef = useRef(state);
  snapshotRef.current = state;
  const [listeners] = useState(() => new Set<() => void>());

  useIkUiHandle(state, dispatch);

  useEffect(() => {
    writePersistedState(state);
  }, [state]);

  useLayoutEffect(() => {
    listeners.forEach((listener) => listener());
  }, [state, listeners]);

  const stateValue = useMemo<PersistentUiStateContextValue>(
    () => ({ state }),
    [state],
  );
  const dispatchValue = useMemo<PersistentUiDispatchContextValue>(
    () => ({ dispatch }),
    [],
  );
  const store = useMemo<PersistentUiStore>(
    () => ({
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      getSnapshot: () => snapshotRef.current,
    }),
    [listeners],
  );

  return (
    <PersistentUiStateContext.Provider value={stateValue}>
      <PersistentUiDispatchContext.Provider value={dispatchValue}>
        <PersistentUiStoreContext.Provider value={store}>
          {children}
        </PersistentUiStoreContext.Provider>
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

/**
 * Subscribes to one derived value of the persistent UI state. The component
 * re-renders only when the selected value changes (`Object.is`), so dispatches
 * that leave it untouched skip the component entirely. Selectors must return
 * a primitive or a reference stable across identical state.
 *
 * @template T - Selected value type
 * @param {(state: PersistentUiState) => T} selector - Pure projection of the state
 * @returns {T} The selected value
 * @throws {Error} When used outside a PersistentUiProvider
 */
export function usePersistentUiSelector<T>(
  selector: (state: PersistentUiState) => T,
): T {
  const store = useContext(PersistentUiStoreContext);
  if (!store) {
    throw new Error(
      'usePersistentUiSelector must be used within a PersistentUiProvider',
    );
  }
  const getSelected = () => selector(store.getSnapshot());
  return useSyncExternalStore(store.subscribe, getSelected, getSelected);
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
