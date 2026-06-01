/**
 * @fileoverview Hook to access sidebar menu action dispatchers
 * @module modules/navigation-sidebar/application/hooks/useSidebarMenuActions
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiDispatch } from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { useCallback, useMemo } from 'react';

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
    [dispatch],
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
    [setOpen, toggle, close, open],
  );
}
