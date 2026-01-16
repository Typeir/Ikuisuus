/**
 * Sidebar State Hooks
 *
 * @fileoverview React hooks for sidebar menu state and actions.
 * Provides access to sidebar open/close state and expansion paths.
 *
 * @module lib/hooks/useSidebarState
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
    SidebarMenuState,
} from '../types/persistentUiState';

/**
 * Hook to access sidebar menu state
 *
 * @function useSidebarMenuState
 * @returns {SidebarMenuState & { isHydrated: boolean }} Sidebar state with hydration flag
 */
export function useSidebarMenuState(): SidebarMenuState & {
  isHydrated: boolean;
} {
  const state = usePersistentUiState();
  return {
    ...state.sidebarMenu,
    isHydrated: state.isHydrated,
  };
}

/**
 * Sidebar menu action helpers
 *
 * @interface SidebarMenuActions
 * @property {(isOpen: boolean) => void} setOpen - Set sidebar open state
 * @property {() => void} toggle - Toggle sidebar open state
 * @property {() => void} close - Close sidebar
 * @property {() => void} open - Open sidebar
 */
export interface SidebarMenuActions {
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

/**
 * Hook to access sidebar menu actions
 *
 * @function useSidebarMenuActions
 * @returns {SidebarMenuActions} Action functions for sidebar menu
 */
export function useSidebarMenuActions(): SidebarMenuActions {
  const dispatch = usePersistentUiDispatch();

  const setOpen = useCallback(
    (isOpen: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
        payload: { isOpen },
      });
    },
    [dispatch]
  );

  const toggle = useCallback(() => {
    dispatch({ type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR });
  }, [dispatch]);

  const close = useCallback(() => {
    dispatch({
      type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
      payload: { isOpen: false },
    });
  }, [dispatch]);

  const open = useCallback(() => {
    dispatch({
      type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
      payload: { isOpen: true },
    });
  }, [dispatch]);

  return useMemo(
    () => ({ setOpen, toggle, close, open }),
    [setOpen, toggle, close, open]
  );
}

/**
 * Sidebar expansion action helpers
 *
 * @interface SidebarExpansionActions
 * @property {(path: string, expanded: boolean) => void} setExpanded - Set expansion state for a path
 * @property {(path: string) => void} togglePath - Toggle expansion for a path
 * @property {(path: string) => boolean} isExpanded - Check if a path is expanded
 */
export interface SidebarExpansionActions {
  setExpanded: (path: string, expanded: boolean) => void;
  togglePath: (path: string) => void;
  isExpanded: (path: string) => boolean;
}

/**
 * Hook to access sidebar expansion actions
 *
 * @function useSidebarExpansionActions
 * @returns {SidebarExpansionActions} Action functions for sidebar expansion control
 */
export function useSidebarExpansionActions(): SidebarExpansionActions {
  const dispatch = usePersistentUiDispatch();
  const { expandedPaths } = useSidebarMenuState();

  const setExpanded = useCallback(
    (path: string, expanded: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path, expanded },
      });
    },
    [dispatch]
  );

  const togglePath = useCallback(
    (path: string) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path },
      });
    },
    [dispatch]
  );

  const isExpanded = useCallback(
    (path: string) => {
      return expandedPaths.includes(path);
    },
    [expandedPaths]
  );

  return useMemo(
    () => ({ setExpanded, togglePath, isExpanded }),
    [setExpanded, togglePath, isExpanded]
  );
}
