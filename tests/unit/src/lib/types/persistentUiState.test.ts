/**
 * PersistentUiState Types Unit Tests
 *
 * @fileoverview Tests for persistent UI state type definitions and constants.
 */

import {
    DEFAULT_PERSISTENT_UI_STATE,
    LEGACY_THEME_KEY,
    PERSISTED_UI_ACTION_TYPES,
    PERSISTENT_UI_STORAGE_KEY,
} from '@/lib/types/persistentUiState';
import { describe, expect, it } from 'vitest';

describe('PersistentUiState types', () => {
  describe('DEFAULT_PERSISTENT_UI_STATE', () => {
    it('should have dark theme as default', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.theme).toBe('dark');
    });

    it('should have sidebar menu closed by default', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.sidebarMenu.isOpen).toBe(false);
    });

    it('should have isHydrated as false by default', () => {
      expect(DEFAULT_PERSISTENT_UI_STATE.isHydrated).toBe(false);
    });
  });

  describe('Storage keys', () => {
    it('should export PERSISTENT_UI_STORAGE_KEY', () => {
      expect(PERSISTENT_UI_STORAGE_KEY).toBe('ikuisuus-ui-state');
    });

    it('should export LEGACY_THEME_KEY', () => {
      expect(LEGACY_THEME_KEY).toBe('data-theme');
    });
  });

  describe('PERSISTED_UI_ACTION_TYPES', () => {
    it('should have namespaced action types', () => {
      expect(PERSISTED_UI_ACTION_TYPES.HYDRATE_FROM_STORAGE).toBe(
        'PERSISTED_UI/HYDRATE_FROM_STORAGE'
      );
      expect(PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN).toBe(
        'PERSISTED_UI/SET_SIDEBAR_OPEN'
      );
      expect(PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR).toBe(
        'PERSISTED_UI/TOGGLE_SIDEBAR'
      );
      expect(PERSISTED_UI_ACTION_TYPES.SET_THEME).toBe('PERSISTED_UI/SET_THEME');
      expect(PERSISTED_UI_ACTION_TYPES.RESET).toBe('PERSISTED_UI/RESET');
    });
  });
});
