/**
 * PersistentUiReducer Unit Tests
 *
 * @fileoverview Tests for the persistent UI state reducer including all action types
 * and state transitions.
 */

import { persistentUiReducer } from '@/lib/reducers/persistentUiReducer';
import {
    DEFAULT_PERSISTENT_UI_STATE,
    PERSISTED_UI_ACTION_TYPES,
    PersistentUiState,
} from '@/lib/types/persistentUiState';
import { describe, expect, it } from 'vitest';

describe('persistentUiReducer', () => {
  describe('HYDRATE_FROM_STORAGE', () => {
    it('should merge hydrated state with default state', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE,
        payload: {
          theme: 'light',
          sidebarMenu: { isOpen: true, expandedPaths: [] },
        },
      });

      expect(result.theme).toBe('light');
      expect(result.sidebarMenu.isOpen).toBe(true);
      expect(result.isHydrated).toBe(true);
    });

    it('should preserve default values for missing hydrated fields', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE,
        payload: { theme: 'light' },
      });

      expect(result.theme).toBe('light');
      expect(result.sidebarMenu.isOpen).toBe(false);
      expect(result.isHydrated).toBe(true);
    });
  });

  describe('SET_SIDEBAR_OPEN', () => {
    it('should set sidebar open state to true', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
        payload: { isOpen: true },
      });

      expect(result.sidebarMenu.isOpen).toBe(true);
    });

    it('should set sidebar open state to false', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: { isOpen: true, expandedPaths: [] },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
        payload: { isOpen: false },
      });

      expect(result.sidebarMenu.isOpen).toBe(false);
    });
  });

  describe('SET_ASPECT_DISPLAY', () => {
    it('should default to compact and set the display mode', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.aspectDisplay).toBe('compact');
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_DISPLAY,
        payload: { display: 'verbose' },
      });
      expect(result.aspectDisplay).toBe('verbose');
    });
  });

  describe('SET_STREAM_TEXT', () => {
    it('should ship drawn and drop the ticker on request', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.streamText).toBe(true);
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_STREAM_TEXT,
        payload: { enabled: false },
      });
      expect(result.streamText).toBe(false);
      expect(result.sectionDecor).toBe(true);
    });
  });

  describe('SET_SECTION_DECOR', () => {
    it('should ship drawn and drop the frames on request', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.sectionDecor).toBe(true);
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SECTION_DECOR,
        payload: { enabled: false },
      });
      expect(result.sectionDecor).toBe(false);
      expect(result.streamText).toBe(true);
    });
  });

  describe('TOGGLE_SIDEBAR', () => {
    it('should toggle sidebar from closed to open', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR,
      });

      expect(result.sidebarMenu.isOpen).toBe(true);
    });

    it('should toggle sidebar from open to closed', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: { isOpen: true, expandedPaths: [] },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR,
      });

      expect(result.sidebarMenu.isOpen).toBe(false);
    });
  });

  describe('SET_THEME', () => {
    it('should set theme to light', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
        payload: { theme: 'light' },
      });

      expect(result.theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        theme: 'light',
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
        payload: { theme: 'dark' },
      });

      expect(result.theme).toBe('dark');
    });

    it('should preserve other state when setting theme', () => {
      const initialState: PersistentUiState = {
        theme: 'dark',
        sidebarMenu: { isOpen: true, expandedPaths: [] },
        isHydrated: true,
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
        payload: { theme: 'light' },
      });

      expect(result.theme).toBe('light');
      expect(result.sidebarMenu.isOpen).toBe(true);
      expect(result.isHydrated).toBe(true);
    });
  });

  describe('SET_CORRECTIONS_TOKEN', () => {
    it('should set the corrections token', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN,
        payload: { token: 'abc123' },
      });

      expect(result.correctionsToken).toBe('abc123');
    });

    it('should replace an existing token', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        correctionsToken: 'old-token',
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN,
        payload: { token: 'new-token' },
      });

      expect(result.correctionsToken).toBe('new-token');
    });

    it('should preserve other state when setting token', () => {
      const initialState: PersistentUiState = {
        theme: 'light',
        sidebarMenu: { isOpen: true, expandedPaths: ['a'] },
        isHydrated: true,
        correctionsToken: null,
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_CORRECTIONS_TOKEN,
        payload: { token: 'tok' },
      });

      expect(result.theme).toBe('light');
      expect(result.sidebarMenu.isOpen).toBe(true);
      expect(result.isHydrated).toBe(true);
    });
  });

  describe('SET_SIDEBAR_EXPANSION', () => {
    it('should expand a path and add it to expandedPaths', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path: 'world/ages', expanded: true },
      });

      expect(result.sidebarMenu.expandedPaths).toContain('world/ages');
    });

    it('should collapse a path by removing it from expandedPaths', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: {
          isOpen: true,
          expandedPaths: ['world/ages', 'monsters'],
        },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path: 'world/ages', expanded: false },
      });

      expect(result.sidebarMenu.expandedPaths).not.toContain('world/ages');
      expect(result.sidebarMenu.expandedPaths).toContain('monsters');
    });

    it('should auto-close sibling paths at the same depth when expanding', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: {
          isOpen: true,
          expandedPaths: ['world/ages', 'world/factions', 'monsters'],
        },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path: 'world/regions', expanded: true },
      });

      expect(result.sidebarMenu.expandedPaths).toContain('world/regions');
      expect(result.sidebarMenu.expandedPaths).not.toContain('world/ages');
      expect(result.sidebarMenu.expandedPaths).not.toContain('world/factions');
      expect(result.sidebarMenu.expandedPaths).toContain('monsters');
    });

    it('should keep paths at different depths untouched', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: {
          isOpen: true,
          expandedPaths: ['world', 'world/ages/dawn'],
        },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path: 'world/ages', expanded: true },
      });

      expect(result.sidebarMenu.expandedPaths).toContain('world');
      expect(result.sidebarMenu.expandedPaths).toContain('world/ages/dawn');
      expect(result.sidebarMenu.expandedPaths).toContain('world/ages');
    });
  });

  describe('TOGGLE_SIDEBAR_PATH', () => {
    it('should add a path when not expanded', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path: 'monsters' },
      });

      expect(result.sidebarMenu.expandedPaths).toContain('monsters');
    });

    it('should remove a path when already expanded', () => {
      const initialState: PersistentUiState = {
        ...DEFAULT_PERSISTENT_UI_STATE,
        sidebarMenu: { isOpen: true, expandedPaths: ['monsters', 'spells'] },
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path: 'monsters' },
      });

      expect(result.sidebarMenu.expandedPaths).not.toContain('monsters');
      expect(result.sidebarMenu.expandedPaths).toContain('spells');
    });

    it('should handle empty expandedPaths', () => {
      const result = persistentUiReducer(DEFAULT_PERSISTENT_UI_STATE, {
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path: 'items' },
      });

      expect(result.sidebarMenu.expandedPaths).toEqual(['items']);
    });
  });

  describe('RESET', () => {
    it('should reset state to defaults but preserve isHydrated', () => {
      const initialState: PersistentUiState = {
        theme: 'light',
        sidebarMenu: { isOpen: true, expandedPaths: [] },
        isHydrated: true,
      };

      const result = persistentUiReducer(initialState, {
        type: PERSISTED_UI_ACTION_TYPES.RESET,
      });

      expect(result.theme).toBe('dark');
      expect(result.sidebarMenu.isOpen).toBe(false);
      expect(result.isHydrated).toBe(true);
    });
  });

  describe('unknown action', () => {
    it('should return current state for unknown action types', () => {
      const initialState: PersistentUiState = {
        theme: 'light',
        sidebarMenu: { isOpen: true, expandedPaths: [] },
        isHydrated: true,
      };

      const result = persistentUiReducer(initialState, {
        type: 'UNKNOWN_ACTION' as any,
      });

      expect(result).toEqual(initialState);
    });
  });
});
