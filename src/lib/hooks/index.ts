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
    useSidebarExpansionActions,
    useSidebarMenuActions,
    useSidebarMenuState
} from './useSidebarState';
export type {
    SidebarExpansionActions,
    SidebarMenuActions
} from './useSidebarState';

export { useThemeActions, useThemeState } from './useThemeState';
export type { ThemeActions, ThemeState } from './useThemeState';

export {
    useCorrectionsTokenActions,
    useCorrectionsTokenState
} from './useCorrectionsToken';
export type {
    CorrectionsTokenActions,
    CorrectionsTokenState
} from './useCorrectionsToken';

export { useCorrectionsAuth } from './useCorrectionsAuth';
export type {
    AuthUser,
    CorrectionsAuthActions,
    CorrectionsAuthState
} from './useCorrectionsAuth';

