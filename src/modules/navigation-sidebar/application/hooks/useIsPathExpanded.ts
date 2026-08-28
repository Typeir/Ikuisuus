/**
 * @fileoverview Per-path read of sidebar expansion state
 * @description Subscribes a component to whether one path is expanded and
 * nothing else, so dispatches on other paths, the theme, or display prefs
 * skip it.
 *
 * @module modules/navigation-sidebar/application/hooks/useIsPathExpanded
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

'use client';

import { usePersistentUiSelector } from '@/lib/context/PersistentUiContext';
import type { PersistentUiState } from '@/lib/types/persistentUiState';
import { useCallback } from 'react';

/**
 * Whether `path` is in the persisted expanded-paths set.
 *
 * @param {string} path - Sidebar item path
 * @returns {boolean} True when the path is expanded
 */
export function useIsPathExpanded(path: string): boolean {
  const selectExpanded = useCallback(
    (state: PersistentUiState) =>
      state.sidebarMenu.expandedPaths.includes(path),
    [path],
  );
  return usePersistentUiSelector(selectExpanded);
}
