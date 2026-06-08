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

export function useSidebarExpansion(): SidebarExpansionActions {
  const dispatch = usePersistentUiDispatch();
  const { expandedPaths } = useSidebarMenu();

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
