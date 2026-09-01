/**
 * @fileoverview Persists and retrieves encounter data via the persistent storage abstraction.
 * @description CRUD for encounter data keyed by the EncounterStorage enum.
 * Encounters array uses the ref strategy (storePersistentDataRef/fetchPersistentDataRef);
 * scalar IDs use storePersistentData.
 *
 * @module modules/encounter-planner/infrastructure/persistence/encounterRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { logger } from '@/lib/logging/logger';
import { fetchPersistentData } from '@/lib/utils/fetchPersistentData';
import { ensureStorageSchema } from '@/lib/utils/storageSchema';
import {
    fetchPersistentDataRef,
    removePersistentData,
    storePersistentData,
    storePersistentDataRef,
} from '@/lib/utils/storePersistentData';
import type {
    AffixEntry,
    CreatureEntry,
    Encounter,
} from '../../domain/encounters/encounter.types';
import { EncounterStorage } from '../../domain/storage/encounterStorageKeys';

/**
 * Migrates encounter data from old format, converting affixes from string[] to AffixEntry[].
 *
 * @function migrateEncounter
 * @param {any} encounter - Encounter data from localStorage (may be old format)
 * @returns {Encounter} Encounter with migrated data
 * @deprecated Legacy migration path; current encounter reads do not invoke this helper.
 */
const migrateEncounter = (encounter: any): Encounter => {
  const creatures = (encounter.creatures || []).map((creature: any) => {
    const details = creature.details || {};

    if (Array.isArray(details.affixes)) {
      details.affixes = details.affixes.map((affix: string | AffixEntry) => {
        if (typeof affix === 'object' && affix !== null) {
          return affix as AffixEntry;
        }
        return { text: affix as string } as AffixEntry;
      });
    } else {
      details.affixes = [];
    }

    return { ...creature, details };
  });

  return { ...encounter, creatures };
};

/**
 * Returns all encounters from localStorage.
 * Returns empty array if none exist, on parse error, or in SSR context.
 *
 * @function getEncounters
 * @returns {Encounter[]} Array of all saved encounters, or empty array on error
 */
export const getEncounters = (): Encounter[] => {
  if (typeof window === 'undefined') return [];
  ensureStorageSchema();

  try {
    const data = fetchPersistentDataRef(EncounterStorage.Encounters);
    if (!data) return [];

    const parsed = JSON.parse(data);
    const encounters = Array.isArray(parsed) ? parsed : [];

    return encounters as Encounter[];
  } catch (error) {
    logger.warning('Error loading encounters from storage', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Returns the active encounter ID from localStorage.
 * Returns null if none set or in SSR context.
 *
 * @function getActiveEncounterId
 * @returns {string | null} Active encounter ID, or null if none set
 */
export const getActiveEncounterId = (): string | null => {
  if (typeof window === 'undefined') return null;
  ensureStorageSchema();
  return fetchPersistentData(EncounterStorage.ActiveEncounterId);
};

/**
 * Sets the active encounter ID in localStorage; null clears it.
 *
 * @function setActiveEncounterId
 * @param {string | null} id - Encounter ID to set as active, or null to clear
 * @returns {void}
 */
export const setActiveEncounterId = (id: string | null): void => {
  if (typeof window === 'undefined') return;

  if (id === null) {
    removePersistentData(EncounterStorage.ActiveEncounterId);
  } else {
    storePersistentData(EncounterStorage.ActiveEncounterId, id);
  }
};

/**
 * Returns the active encounter from localStorage by matching the active ID.
 *
 * @function getActiveEncounter
 * @returns {Encounter | null} Active encounter object, or null if none set/found
 */
export const getActiveEncounter = (): Encounter | null => {
  const encounters = getEncounters();
  const activeId = getActiveEncounterId();

  if (!activeId) return null;

  return encounters.find((e) => e.id === activeId) || null;
};

/**
 * Saves all encounters to localStorage, replacing existing data.
 *
 * @function saveEncounters
 * @param {Encounter[]} encounters - Complete array of encounters to persist
 * @returns {void}
 */
export const saveEncounters = (encounters: Encounter[]): void => {
  if (typeof window === 'undefined') return;

  try {
    storePersistentDataRef(
      EncounterStorage.Encounters,
      JSON.stringify(encounters),
    );
  } catch (error) {
    logger.error('Error saving encounters to storage', {
      error: error instanceof Error ? error.message : String(error),
      encounterCount: encounters.length,
    });
  }
};

/**
 * Saves or updates a single encounter in localStorage; sets updatedAt to now.
 *
 * @function saveEncounter
 * @param {Encounter} encounter - Encounter to save (id must be set)
 * @returns {void}
 */
export const saveEncounter = (encounter: Encounter): void => {
  const encounters = getEncounters();
  const existingIndex = encounters.findIndex((e) => e.id === encounter.id);

  encounter.updatedAt = new Date().toISOString();

  if (existingIndex >= 0) {
    encounters[existingIndex] = encounter;
  } else {
    encounters.push(encounter);
  }

  saveEncounters(encounters);
};

/**
 * Deletes an encounter by ID from localStorage.
 * Clears the active encounter ID if the deleted encounter is active.
 *
 * @function deleteEncounter
 * @param {string} id - ID of encounter to delete
 * @returns {void}
 */
export const deleteEncounter = (id: string): void => {
  const encounters = getEncounters();
  const filtered = encounters.filter((e) => e.id !== id);
  saveEncounters(filtered);

  if (getActiveEncounterId() === id) {
    setActiveEncounterId(null);
  }
};

export type { CreatureEntry };

