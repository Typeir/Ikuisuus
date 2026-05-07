/**
 * CharacterSheet State Types Unit Tests
 *
 * @fileoverview Tests for action type constants and default state in characterSheet module.
 */

import {
    CHARACTER_SHEET_ACTION_TYPES,
    CHARACTER_SHEET_STORAGE_KEY,
    DEFAULT_CHARACTER_SHEET_STATE,
} from '@/lib/types/characterSheet';
import { describe, expect, it } from 'vitest';

describe('CHARACTER_SHEET_STORAGE_KEY', () => {
  it('should be a non-empty string', () => {
    expect(typeof CHARACTER_SHEET_STORAGE_KEY).toBe('string');
    expect(CHARACTER_SHEET_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});

describe('CHARACTER_SHEET_ACTION_TYPES', () => {
  it('should have all required action keys', () => {
    expect(CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER).toBeDefined();
    expect(CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER).toBeDefined();
    expect(CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID).toBeDefined();
    expect(CHARACTER_SHEET_ACTION_TYPES.RESET).toBeDefined();
  });

  it('should use namespaced string values', () => {
    Object.values(CHARACTER_SHEET_ACTION_TYPES).forEach((v) => {
      expect(v).toContain('CHARACTER_SHEET/');
    });
  });
});

describe('DEFAULT_CHARACTER_SHEET_STATE', () => {
  it('should have an empty characters array', () => {
    expect(DEFAULT_CHARACTER_SHEET_STATE.characters).toEqual([]);
  });

  it('should have activeId as null', () => {
    expect(DEFAULT_CHARACTER_SHEET_STATE.activeId).toBeNull();
  });

  it('should have isHydrated as false', () => {
    expect(DEFAULT_CHARACTER_SHEET_STATE.isHydrated).toBe(false);
  });
});
