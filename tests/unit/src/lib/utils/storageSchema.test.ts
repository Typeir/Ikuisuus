/**
 * @fileoverview Storage Schema Version Tests
 * @description Tests that ensureStorageSchema drops stale or unversioned
 * storage, leaves current-version storage alone, and runs once per page load.
 *
 * @module tests/unit/src/lib/utils/storageSchema.test
 * @version 1.0.0
 * @author Typeir
 * @since 10.0.0
 */

import { CHARACTER_SHEET_STORAGE_KEY } from '@/lib/types/characterSheet';
import {
    STORAGE_SCHEMA_KEY,
    STORAGE_SCHEMA_VERSION,
    VERSIONED_STORAGE_KEYS,
    ensureStorageSchema,
    resetStorageSchemaCheck,
} from '@/lib/utils/storageSchema';
import { EncounterStorage } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * Writes a stale payload to every versioned store in both local and session storage.
 *
 * @function seedAllStores
 * @returns {void}
 */
const seedAllStores = (): void => {
  for (const key of VERSIONED_STORAGE_KEYS) {
    localStorage.setItem(key, '["stale"]');
    sessionStorage.setItem(key, '["stale"]');
  }
};

describe('ensureStorageSchema', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie
      .split(';')
      .map((c) => c.split('=')[0].trim())
      .filter(Boolean)
      .forEach((name) => {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      });
    resetStorageSchemaCheck();
  });

  it('purges every versioned store when no version has been written', () => {
    seedAllStores();
    ensureStorageSchema();
    for (const key of VERSIONED_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(key)).toBeNull();
    }
  });

  it('purges when the stored version is older than the current one', () => {
    localStorage.setItem(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION - 1));
    seedAllStores();
    ensureStorageSchema();
    expect(localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(EncounterStorage.Encounters)).toBeNull();
  });

  it('drops character and encounter storage together', () => {
    seedAllStores();
    ensureStorageSchema();
    expect(localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(EncounterStorage.SavedParties)).toBeNull();
    expect(localStorage.getItem(EncounterStorage.InProgressCombats)).toBeNull();
  });

  it('records the current version after purging', () => {
    seedAllStores();
    ensureStorageSchema();
    expect(localStorage.getItem(STORAGE_SCHEMA_KEY)).toBe(
      String(STORAGE_SCHEMA_VERSION),
    );
  });

  it('leaves storage untouched when the version already matches', () => {
    localStorage.setItem(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
    seedAllStores();
    ensureStorageSchema();
    expect(localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY)).toBe('["stale"]');
  });

  it('runs at most once per page load', () => {
    ensureStorageSchema();
    localStorage.setItem(CHARACTER_SHEET_STORAGE_KEY, '["written after"]');
    ensureStorageSchema();
    expect(localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY)).toBe(
      '["written after"]',
    );
  });
});
