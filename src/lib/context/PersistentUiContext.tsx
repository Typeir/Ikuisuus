/**
 * Persistent UI Context and Provider
 *
 * @fileoverview Minimal React Context for persistent UI state management.
 * Hooks are exported from lib/hooks/ for SOLID separation.
 *
 * @module lib/context/PersistentUiContext
 * @version 2.2.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { deriveExpandedPathsFromUrl } from '@/modules/library/application/selectors/deriveExpandedPathsFromUrl';
import { isStaticContentRoute } from '@/modules/library/application/selectors/isStaticContentRoute';
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
  LEGACY_THEME_KEY,
  PERSISTENT_UI_STORAGE_KEY,
  PersistentUiAction,
  PersistentUiState,
  SerializedPersistentUiState,
  ThemeValue,
} from '../types/persistentUiState';
import { fetchPersistentData } from '../utils/fetchPersistentData';
import { storePersistentData } from '../utils/storePersistentData';

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
 * Reads persisted state with server-provided expanded paths for SSR
 *
 * @function readPersistedState
 * @param {string[]} serverExpandedPaths - Paths from server cookies for hydration match
 * @returns {SerializedPersistentUiState} State with theme and sidebar expansion
 *
 * @description
 * Uses serverExpandedPaths on initial render (SSR and client hydration) for static routes.
 * For dynamic routes, restores expansion from unified storage (cookies → session → local).
 * Falls back to URL-derived paths when no persisted state exists.
 * Theme is read from unified storage with legacy key migration.
 */
function readPersistedState(
  serverExpandedPaths: string[],
): SerializedPersistentUiState {
  let expandedPaths: string[] = [];
  const isStatic = isStaticContentRoute();

  if (isStatic) {
    expandedPaths =
      serverExpandedPaths.length > 0
        ? serverExpandedPaths
        : deriveExpandedPathsFromUrl();
  } else {
    const stored = fetchPersistentData(PERSISTENT_UI_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SerializedPersistentUiState;
        if (parsed.sidebarMenu?.expandedPaths) {
          expandedPaths = parsed.sidebarMenu.expandedPaths;
        }
      } catch {
        expandedPaths = deriveExpandedPathsFromUrl();
      }
    }

    if (expandedPaths.length === 0) {
      expandedPaths = deriveExpandedPathsFromUrl();
    }
  }

  let theme: ThemeValue = 'dark';
  let correctionsToken: string | null = null;
  const stored = fetchPersistentData(PERSISTENT_UI_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as SerializedPersistentUiState;
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        theme = parsed.theme;
      }
      if (
        typeof parsed.correctionsToken === 'string' ||
        parsed.correctionsToken === null
      ) {
        correctionsToken = parsed.correctionsToken;
      }
    } catch {
      const legacyTheme = fetchPersistentData(LEGACY_THEME_KEY);
      if (legacyTheme === 'dark' || legacyTheme === 'light') {
        theme = legacyTheme;
      }
    }
  } else {
    const legacyTheme = fetchPersistentData(LEGACY_THEME_KEY);
    if (legacyTheme === 'dark' || legacyTheme === 'light') {
      theme = legacyTheme;
    }
  }

  return {
    theme,
    correctionsToken,
    sidebarMenu: { expandedPaths, isOpen: false },
  };
}

/**
 * Writes state to unified persistent storage and updates DOM theme attribute
 *
 * @function writePersistedState
 * @param {PersistentUiState} state - Current UI state to persist
 * @returns {void}
 *
 * @description
 * Serializes state and writes to all storage layers (cookies, sessionStorage, localStorage)
 * via storePersistentData. Also updates the DOM data-theme attribute for CSS theming.
 */
function writePersistedState(state: PersistentUiState): void {
  if (typeof window === 'undefined') return;

  const serialized: SerializedPersistentUiState = {
    sidebarMenu: state.sidebarMenu,
    theme: state.theme,
    correctionsToken: state.correctionsToken,
  };

  storePersistentData(PERSISTENT_UI_STORAGE_KEY, JSON.stringify(serialized));
  storePersistentData(LEGACY_THEME_KEY, state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
}

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
 * @description
 * Uses server-provided initialExpandedPaths to prevent hydration mismatch.
 * Server reads cookies; client uses same values on first render.
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

export {
  useSidebarExpansion as useSidebarExpansionActions
} from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
export { useSidebarMenuActions } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenuActions';
export { useSidebarMenu as useSidebarMenuState } from '@/modules/navigation-sidebar/application/hooks/useSidebarMenu';
export type {
  SidebarExpansionActions
} from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
export type {
  SidebarMenuActions
} from '@/modules/navigation-sidebar/application/hooks/useSidebarMenuActions';

export { useThemeActions, useThemeState } from '../hooks/useThemeState';
export type { ThemeActions, ThemeState } from '../hooks/useThemeState';

export {
  useCorrectionsTokenActions,
  useCorrectionsTokenState
} from '../../modules/mdx-editor/application/hooks/useCorrectionsToken';
export type {
  CorrectionsTokenActions,
  CorrectionsTokenState
} from '../../modules/mdx-editor/application/hooks/useCorrectionsToken';

