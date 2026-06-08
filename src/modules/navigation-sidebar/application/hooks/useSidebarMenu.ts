/**
 * @fileoverview Hook to access sidebar menu state from Redux store
 * @module modules/navigation-sidebar/application/hooks/useSidebarMenu
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiState } from '@/lib/context/PersistentUiContext';
import type { SidebarMenuState } from '@/lib/types/persistentUiState';

/**
 * Hook to access sidebar menu state
 *
 * @function useSidebarMenu
 * @returns {SidebarMenuState & { isHydrated: boolean }} Sidebar state with hydration flag
 */
export function useSidebarMenu(): SidebarMenuState & { isHydrated: boolean } {
  const state = usePersistentUiState();
  return {
    ...state.sidebarMenu,
    isHydrated: state.isHydrated,
  };
}
