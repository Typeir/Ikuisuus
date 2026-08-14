/**
 * Persistent UI State Types and Action Schema
 *
 * @fileoverview Typed state shapes and action types for persistent UI state.
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
 * Namespaced string literals.
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
  SET_UNIT_SYSTEM: 'PERSISTED_UI/SET_UNIT_SYSTEM',
  SET_ASPECT_EXPANDED: 'PERSISTED_UI/SET_ASPECT_EXPANDED',
  RESET: 'PERSISTED_UI/RESET',
} as const;

/**
 * Sidebar menu state shape
 *
 * @interface SidebarMenuState
 * @property {boolean} isOpen - Whether the sidebar menu is open
 * @property {string[]} expandedPaths - Expanded sidebar tree paths
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
 * Unit system display preference. `stride` is the server-rendered default.
 *
 * @typedef {'stride' | 'metric' | 'imperial'} UnitSystemValue
 */
export type UnitSystemValue = 'stride' | 'metric' | 'imperial';

/**
 * Measurement families with independently set unit preferences.
 *
 * @typedef {'distance' | 'weight' | 'volume'} UnitDimension
 */
export type UnitDimension = 'distance' | 'weight' | 'volume';

/**
 * Display preference per measurement family.
 *
 * @interface UnitSystemPreferences
 * @property {UnitSystemValue} distance - Preference for strides and leagues
 * @property {UnitSystemValue} weight - Preference for burdens
 * @property {UnitSystemValue} volume - Preference for volumes
 */
export interface UnitSystemPreferences {
  distance: UnitSystemValue;
  weight: UnitSystemValue;
  volume: UnitSystemValue;
}

/**
 * All preferences default to `stride`.
 *
 * @constant
 */
export const DEFAULT_UNIT_SYSTEM: UnitSystemPreferences = {
  distance: 'stride',
  weight: 'stride',
  volume: 'stride',
};

/**
 * Complete persistent UI state shape
 *
 * @interface PersistentUiState
 * @property {SidebarMenuState} sidebarMenu - Sidebar menu state
 * @property {ThemeValue} theme - Current theme value
 * @property {UnitSystemPreferences} unitSystem - Display preference per measurement family
 * @property {string | null} correctionsToken - HMAC token for corrections API (persists annually)
 * @property {boolean} aspectExpanded - Whether aspect carousels stay unpacked without hovering
 * @property {boolean} isHydrated - Whether state has been hydrated from storage
 */
export interface PersistentUiState {
  sidebarMenu: SidebarMenuState;
  theme: ThemeValue;
  unitSystem: UnitSystemPreferences;
  correctionsToken: string | null;
  aspectExpanded: boolean;
  isHydrated: boolean;
}

/**
 * Serialized format for localStorage/cookie storage.
 * Only includes fields that should be persisted.
 *
 * @interface SerializedPersistentUiState
 * @property {SidebarMenuState} [sidebarMenu] - Optional sidebar menu state
 * @property {ThemeValue} [theme] - Optional theme value
 * @property {UnitSystemPreferences | UnitSystemValue} [unitSystem] - Display
 *   preferences. A bare string is accepted from records written before the
 *   preference was split per measurement family, and applies to all three.
 * @property {string | null} [correctionsToken] - Optional corrections API token
 * @property {boolean} [aspectExpanded] - Optional aspect carousel expansion
 */
export interface SerializedPersistentUiState {
  sidebarMenu?: SidebarMenuState;
  theme?: ThemeValue;
  unitSystem?: UnitSystemPreferences | UnitSystemValue;
  correctionsToken?: string | null;
  aspectExpanded?: boolean;
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
 * Action to set the unit display system
 *
 * @interface SetUnitSystemAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM} type - Action type identifier
 * @property {{ unitSystem: UnitSystemValue }} payload - New unit system value
 */
export interface SetUnitSystemAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM;
  payload: { dimension: UnitDimension; system: UnitSystemValue };
}

/**
 * Action to set whether aspect carousels stay unpacked. Preference is global,
 * not per-row.
 *
 * @interface SetAspectExpandedAction
 * @property {typeof PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED} type - Action type identifier
 * @property {{ expanded: boolean }} payload - New expansion state
 */
export interface SetAspectExpandedAction {
  type: typeof PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED;
  payload: { expanded: boolean };
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
  | SetUnitSystemAction
  | SetAspectExpandedAction
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
  unitSystem: DEFAULT_UNIT_SYSTEM,
  correctionsToken: null,
  aspectExpanded: false,
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
