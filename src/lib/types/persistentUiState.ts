/**
 * Persistent UI State Types and Action Schema
 *
 * @fileoverview Defines typed state shapes and action types for the persistent UI state system.
 * This module provides the foundation for a reducer-driven persistent storage approach,
 * enabling sidebar menu state persistence across page loads and navigation.
 *
 * @module lib/types/persistentUiState
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires None - Pure type definitions
 *
 * @example
 * ```typescript
 * import type {
 *   PersistentUiState,
 *   PersistentUiAction,
 *   SetSidebarOpenAction
 * } from '@/lib/types/persistentUiState';
 *
 * const action: SetSidebarOpenAction = {
 *   type: 'PERSISTED_UI/SET_SIDEBAR_OPEN',
 *   payload: { isOpen: true }
 * };
 * ```
 */

/**
 * Action type constants for persistent UI state management.
 * Uses namespaced string literals for clarity and conflict prevention.
 *
 * @constant
 */
export const PERSISTED_UI_ACTION_TYPES = {
  HYDRATE_FROM_STORAGE: 'PERSISTED_UI/HYDRATE_FROM_STORAGE',
  SET_SIDEBAR_OPEN: 'PERSISTED_UI/SET_SIDEBAR_OPEN',
  TOGGLE_SIDEBAR: 'PERSISTED_UI/TOGGLE_SIDEBAR',
  SET_THEME: 'PERSISTED_UI/SET_THEME',
  SET_SIDEBAR_EXPANSION: 'PERSISTED_UI/SET_SIDEBAR_EXPANSION',
  TOGGLE_SIDEBAR_PATH: 'PERSISTED_UI/TOGGLE_SIDEBAR_PATH',
  SET_CORRECTIONS_TOKEN: 'PERSISTED_UI/SET_CORRECTIONS_TOKEN',
  RESET: 'PERSISTED_UI/RESET',
} as const;

/**
 * Sidebar menu state shape
 *
 * @interface SidebarMenuState
 * @property {boolean} isOpen - Whether the sidebar menu is currently open
 * @property {string[]} expandedPaths - Array of expanded sidebar tree paths
 */
export interface SidebarMenuState {
  isOpen: boolean;
  expandedPaths: string[];
}

/**
 * Theme state enumeration values
 *
 * @typedef {'dark' | 'light'} ThemeValue
 */
export type ThemeValue = 'dark' | 'light';

/**
 * Complete persistent UI state shape
 *
 * @interface PersistentUiState
 * @property {SidebarMenuState} sidebarMenu - Sidebar menu state
 * @property {ThemeValue} theme - Current theme value
 * @property {string | null} correctionsToken - HMAC token for corrections API (persists annually)
 * @property {boolean} isHydrated - Whether state has been hydrated from storage
 */
export interface PersistentUiState {
  sidebarMenu: SidebarMenuState;
  theme: ThemeValue;
  correctionsToken: string | null;
  isHydrated: boolean;
}

/**
 * Serialized format for localStorage/cookie storage.
 * Only includes fields that should be persisted.
 *
 * @interface SerializedPersistentUiState
 * @property {SidebarMenuState} [sidebarMenu] - Optional sidebar menu state
 * @property {ThemeValue} [theme] - Optional theme value
 * @property {string | null} [correctionsToken] - Optional corrections API token
 */
export interface SerializedPersistentUiState {
  sidebarMenu?: SidebarMenuState;
  theme?: ThemeValue;
  correctionsToken?: string | null;
}

/**
 * Legacy storage format for backwards compatibility.
 * Maps old storage keys to their values.
 *
 * @interface LegacyStorageFormat
 * @property {string} ['data-theme'] - Legacy theme storage key
 */
export interface LegacyStorageFormat {
  'data-theme'?: string;
}

/**
 * Action to hydrate state from persistent storage
 *
 * @interface HydrateFromStorageAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE} type - Action type identifier
 * @property {SerializedPersistentUiState} payload - Hydrated state values
 */
export interface HydrateFromStorageAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE;
  payload: SerializedPersistentUiState;
}

/**
 * Action to explicitly set sidebar open/closed state
 *
 * @interface SetSidebarOpenAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN} type - Action type identifier
 * @property {{ isOpen: boolean }} payload - New open state
 */
export interface SetSidebarOpenAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN;
  payload: { isOpen: boolean };
}

/**
 * Action to toggle sidebar open/closed state
 *
 * @interface ToggleSidebarAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR} type - Action type identifier
 */
export interface ToggleSidebarAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR;
}

/**
 * Action to set theme value
 *
 * @interface SetThemeAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_THEME} type - Action type identifier
 * @property {{ theme: ThemeValue }} payload - New theme value
 */
export interface SetThemeAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_THEME;
  payload: { theme: ThemeValue };
}

/**
 * Action to set sidebar expansion state for a path
 *
 * @interface SetSidebarExpansionAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION} type - Action type identifier
 * @property {{ path: string; expanded: boolean }} payload - Path and expansion state
 */
export interface SetSidebarExpansionAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION;
  payload: { path: string; expanded: boolean };
}

/**
 * Action to toggle sidebar path expansion
 *
 * @interface ToggleSidebarPathAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH} type - Action type identifier
 * @property {{ path: string }} payload - Path to toggle
 */
export interface ToggleSidebarPathAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH;
  payload: { path: string };
}

/**
 * Action to set corrections token
 *
 * @interface SetCorrectionsTokenAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN} type - Action type identifier
 * @property {{ token: string | null }} payload - New token value (null to clear)
 */
export interface SetCorrectionsTokenAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN;
  payload: { token: string | null };
}

/**
 * Action to reset state to defaults
 *
 * @interface ResetAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.RESET} type - Action type identifier
 */
export interface ResetAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.RESET;
}

/**
 * Union type of all possible persistent UI actions
 *
 * @typedef {HydrateFromStorageAction | SetSidebarOpenAction | ToggleSidebarAction | SetThemeAction | SetSidebarExpansionAction | ToggleSidebarPathAction | SetCorrectionsTokenAction | ResetAction} PersistentUiAction
 */
export type PersistentUiAction =
  | HydrateFromStorageAction
  | SetSidebarOpenAction
  | ToggleSidebarAction
  | SetThemeAction
  | SetSidebarExpansionAction
  | ToggleSidebarPathAction
  | SetCorrectionsTokenAction
  | ResetAction;

/**
 * Default initial state for persistent UI
 *
 * @constant
 */
export const DEFAULT_PERSISTENT_UI_STATE: PersistentUiState = {
  sidebarMenu: {
    isOpen: false,
    expandedPaths: [],
  },
  theme: 'dark',
  correctionsToken: null,
  isHydrated: false,
};

/**
 * Storage key for the unified persistent UI state
 *
 * @constant
 */
export const PERSISTENT_UI_STORAGE_KEY = 'ikuisuus-ui-state';

/**
 * Legacy storage key for theme (for backwards compatibility)
 *
 * @constant
 */
export const LEGACY_THEME_KEY = 'data-theme';
