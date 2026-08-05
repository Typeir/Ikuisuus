/**
 * Persistent UI Reducer
 *
 * @fileoverview Pure reducer function for persistent UI state management.
 * Handles all state transitions for sidebar menu, theme, and hydration state.
 * Implements action-driven state updates for predictable state management.
 *
 * @module lib/reducers/persistentUiReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/types/persistentUiState
 *
 * @example
 * ```typescript
 * import { persistentUiReducer } from '@/lib/reducers/persistentUiReducer';
 * import { DEFAULT_PERSISTENT_UI_STATE, PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
 *
 * const newState = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
 *   type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
 *   payload: { isOpen: true }
 * });
 * ```
 */

import {
    DEFAULT_PERSISTENT_UI_STATE,
    PERSISTED_UI_ACTION_TYPES,
    PersistentUiAction,
    PersistentUiState,
} from '../types/persistentUiState';

/**
 * Reducer function for persistent UI state
 *
 * @function persistentUiReducer
 * @param {PersistentUiState} state - Current state
 * @param {PersistentUiAction} action - Action to process
 * @returns {PersistentUiState} New state after action application
 *
 * @description
 * Handles the following action types:
 * - HYDRATE_FROM_STORAGE: Merges persisted data into state
 * - SET_SIDEBAR_OPEN: Explicitly sets sidebar open state
 * - TOGGLE_SIDEBAR: Toggles sidebar open state
 * - SET_THEME: Updates theme value
 * - SET_SIDEBAR_EXPANSION: Sets expansion with sibling auto-close
 * - TOGGLE_SIDEBAR_PATH: Toggles expansion with sibling auto-close
 * - SET_CORRECTIONS_TOKEN: Updates corrections API token
 * - SET_UNIT_SYSTEM: Updates unit display preference
 * - RESET: Returns to default state
 */
export function persistentUiReducer(
  state: PersistentUiState,
  action: PersistentUiAction,
): PersistentUiState {
  switch (action.type) {
    case PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE: {
      const { sidebarMenu, theme, unitSystem, correctionsToken } =
        action.payload;
      return {
        ...state,
        sidebarMenu: {
          isOpen: sidebarMenu?.isOpen ?? state.sidebarMenu.isOpen,
          expandedPaths: sidebarMenu?.expandedPaths ?? [],
        },
        theme: theme ?? state.theme,
        unitSystem:
          unitSystem && typeof unitSystem === 'object'
            ? unitSystem
            : state.unitSystem,
        correctionsToken: correctionsToken ?? state.correctionsToken,
        isHydrated: true,
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN: {
      return {
        ...state,
        sidebarMenu: {
          ...state.sidebarMenu,
          isOpen: action.payload.isOpen,
        },
      };
    }

    case PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR: {
      return {
        ...state,
        sidebarMenu: {
          ...state.sidebarMenu,
          isOpen: !state.sidebarMenu.isOpen,
        },
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_THEME: {
      return {
        ...state,
        theme: action.payload.theme,
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN: {
      return {
        ...state,
        correctionsToken: action.payload.token,
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_UNIT_SYSTEM: {
      return {
        ...state,
        unitSystem: {
          ...state.unitSystem,
          [action.payload.dimension]: action.payload.system,
        },
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED: {
      return {
        ...state,
        aspectExpanded: action.payload.expanded,
      };
    }

    case PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION: {
      const { path, expanded } = action.payload;
      const currentPaths = state.sidebarMenu.expandedPaths ?? [];

      let expandedPaths: string[];
      if (expanded) {
        const pathDepth = path.split('/').length;
        const parentPath = path.split('/').slice(0, -1).join('/');

        expandedPaths = currentPaths.filter((p) => {
          if (p === path) return false;
          const pDepth = p.split('/').length;
          const pParent = p.split('/').slice(0, -1).join('/');

          if (pDepth !== pathDepth) return true;
          if (pParent !== parentPath) return true;
          return false;
        });
        expandedPaths.push(path);
      } else {
        expandedPaths = currentPaths.filter((p) => p !== path);
      }

      return {
        ...state,
        sidebarMenu: {
          ...state.sidebarMenu,
          expandedPaths,
        },
      };
    }

    case PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH: {
      const { path } = action.payload;
      const currentPaths = state.sidebarMenu.expandedPaths ?? [];
      const isExpanded = currentPaths.includes(path);

      const expandedPaths = isExpanded
        ? currentPaths.filter((p) => p !== path)
        : [...currentPaths, path];

      return {
        ...state,
        sidebarMenu: {
          ...state.sidebarMenu,
          expandedPaths,
        },
      };
    }

    case PERSISTED_UI_ACTION_TYPES.RESET: {
      return {
        ...DEFAULT_PERSISTENT_UI_STATE,
        isHydrated: state.isHydrated,
      };
    }

    default: {
      return state;
    }
  }
}
