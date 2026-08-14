/**
 * @fileoverview Persisted Storage Schema Version
 * @description Guards every client-persisted store behind a single schema
 * version. On the first read of a page load the stored version is compared with
 * {@link STORAGE_SCHEMA_VERSION}; missing or older version drops all payloads
 * and writes the current version.
 *
 * @module lib/utils/storageSchema
 * @version 1.0.0
 * @author Typeir
 * @since 10.0.0
 */

import { CHARACTER_SHEET_STORAGE_KEY } from '@/lib/types/characterSheet';
import { EncounterStorage } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';
import { fetchPersistentData } from './fetchPersistentData';
import { removePersistentData, storePersistentData } from './storePersistentData';

/**
 * Current shape of everything persisted on the client. Increment on any change
 * to a persisted structure to discard saves written against the previous shape.
 *
 * @constant STORAGE_SCHEMA_VERSION
 * @type {number}
 */
export const STORAGE_SCHEMA_VERSION = 2;

/**
 * Key holding the schema version of the data currently on disk.
 *
 * @constant STORAGE_SCHEMA_KEY
 * @type {string}
 */
export const STORAGE_SCHEMA_KEY = 'ikuisuus-storage-version';

/**
 * Every client-persisted key dropped when the schema version moves on.
 *
 * @constant VERSIONED_STORAGE_KEYS
 * @type {readonly string[]}
 */
export const VERSIONED_STORAGE_KEYS: readonly string[] = [
  CHARACTER_SHEET_STORAGE_KEY,
  EncounterStorage.Encounters,
  EncounterStorage.ActiveEncounterId,
  EncounterStorage.InProgressCombats,
  EncounterStorage.ActiveCombatId,
  EncounterStorage.SavedParties,
];

let checkedThisLoad = false;

/**
 * Drops every versioned store and records the current schema version.
 *
 * @function purgeVersionedStorage
 * @returns {void}
 */
const purgeVersionedStorage = (): void => {
  for (const key of VERSIONED_STORAGE_KEYS) removePersistentData(key);
  storePersistentData(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
};

/**
 * Purges stored data when it does not match {@link STORAGE_SCHEMA_VERSION}.
 * Runs at most once per page load; no-op on the server.
 *
 * @function ensureStorageSchema
 * @returns {void}
 */
export const ensureStorageSchema = (): void => {
  if (checkedThisLoad || typeof window === 'undefined') return;
  checkedThisLoad = true;

  const stored = Number.parseInt(
    fetchPersistentData(STORAGE_SCHEMA_KEY) ?? '',
    10,
  );
  if (stored === STORAGE_SCHEMA_VERSION) return;

  purgeVersionedStorage();
};

/**
 * Resets the once-per-load check guard so the check can run again next call.
 *
 * @function resetStorageSchemaCheck
 * @returns {void}
 */
export const resetStorageSchemaCheck = (): void => {
  checkedThisLoad = false;
};
