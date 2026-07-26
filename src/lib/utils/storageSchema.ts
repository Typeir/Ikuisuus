/**
 * @fileoverview Persisted Storage Schema Version
 * @description Guards every client-persisted store behind a single schema
 * version. On the first read of a page load the stored version is compared with
 * {@link STORAGE_SCHEMA_VERSION}; anything missing or older means the payloads
 * were written against a shape this build no longer understands, so they are
 * dropped wholesale and the current version is written in their place.
 *
 * This deliberately replaces per-field data migrations. While the app has no
 * production audience, a discarded local save costs nothing, whereas migration
 * code is permanent surface that has to stay correct for every historical shape.
 * Bump {@link STORAGE_SCHEMA_VERSION} whenever a persisted shape changes and the
 * stale data takes care of itself.
 *
 * Character and encounter data are purged together: a party in the encounter
 * planner references characters by id, so keeping one without the other would
 * leave dangling references.
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
 * Current shape of everything persisted on the client. Bump on ANY change to a
 * persisted structure — character entity, hit-dice log, encounter, party, or
 * in-progress combat — to discard saves written against the previous shape.
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
 * Ensures the persisted stores match {@link STORAGE_SCHEMA_VERSION}, purging
 * them when they do not. Call at the top of every persisted read path; the
 * check runs at most once per page load and is a no-op on the server.
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
 * Clears the once-per-load guard. Test seam only — production code has no
 * reason to re-run the check within a single page load.
 *
 * @function resetStorageSchemaCheck
 * @returns {void}
 */
export const resetStorageSchemaCheck = (): void => {
  checkedThisLoad = false;
};
