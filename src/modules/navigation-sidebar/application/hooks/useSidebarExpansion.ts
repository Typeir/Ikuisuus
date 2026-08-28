/**
 * @fileoverview Hook to access sidebar expansion state and actions
 * @module modules/navigation-sidebar/application/hooks/useSidebarExpansion
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiDispatch } from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { useCallback, useMemo } from 'react';
import { useSidebarMenu } from './useSidebarMenu';

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
 * Write half of the expansion actions. Reads no state, so a consumer that
 * only writes re-renders on nothing but its own props; pair with
 * `useIsPathExpanded` for a per-path read.
 *
 * @type {Pick<SidebarExpansionActions, 'setExpanded' | 'togglePath'>}
 */
export type SidebarExpansionDispatch = Pick<
  SidebarExpansionActions,
  'setExpanded' | 'togglePath'
>;

/**
 * Dispatch-only expansion actions, identity-stable for the provider's lifetime.
 *
 * @returns {SidebarExpansionDispatch} Path expansion writers
 */
export function useSidebarExpansionDispatch(): SidebarExpansionDispatch {
  const dispatch = usePersistentUiDispatch();

  const setExpanded = useCallback(
    (path: string, expanded: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path, expanded },
      });
    },
    [dispatch],
  );

  const togglePath = useCallback(
    (path: string) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path },
      });
    },
    [dispatch],
  );

  return useMemo(() => ({ setExpanded, togglePath }), [setExpanded, togglePath]);
}

export function useSidebarExpansion(): SidebarExpansionActions {
  const { setExpanded, togglePath } = useSidebarExpansionDispatch();
  const { expandedPaths } = useSidebarMenu();

  const isExpanded = useCallback(
    (path: string) => {
      return expandedPaths.includes(path);
    },
    [expandedPaths],
  );

  return useMemo(
    () => ({ setExpanded, togglePath, isExpanded }),
    [setExpanded, togglePath, isExpanded],
  );
}

export const useSidebarExpansionActions = useSidebarExpansion;
