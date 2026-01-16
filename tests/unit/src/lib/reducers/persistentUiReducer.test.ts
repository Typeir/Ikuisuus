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
