/**
 * Hooks Index
 *
 * @fileoverview Re-exports all custom hooks for convenient importing.
 * @module lib/hooks
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

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

export { useThemeActions, useThemeState } from './useThemeState';
export type { ThemeActions, ThemeState } from './useThemeState';

export {
    MOBILE_VIEWPORT_QUERY, useIsMobileViewport, useMediaQuery
} from './useMediaQuery';

