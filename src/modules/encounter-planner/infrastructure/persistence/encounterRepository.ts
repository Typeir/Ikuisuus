/**
 * @fileoverview Encounter Repository
 * @description CRUD operations for persisting and retrieving encounter data using the
 * multi-layer persistent storage abstraction. All storage operations use the
 * EncounterStorage enum for consistent key naming.
 *
 * Large payloads (encounters array) use the ref strategy via
 * storePersistentDataRef/fetchPersistentDataRef; scalar IDs use storePersistentData.
 *
 * @module encounter-planner/infrastructure/persistence/encounterRepository
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
 * Migrate encounter data from old format to new format.
 * Handles backward compatibility for affixes stored as string[] → AffixEntry[].
 *
 * @function migrateEncounter
 * @param {any} encounter - Encounter data from localStorage (may be old format)
 * @returns {Encounter} Encounter with migrated data
 * @deprecated Legacy migration path retained for reference; current encounter reads no longer invoke this helper.
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
 * Retrieve all encounters from localStorage.
 * Returns empty array if no encounters exist, on parse error, or in SSR context.
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
 * Retrieve the ID of the currently active encounter from localStorage.
 * Returns null if no active encounter is set or in SSR context.
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
 * Set the active encounter ID in localStorage.
 * Pass null to clear the active encounter selection.
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
 * Retrieve the currently active encounter from localStorage.
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
 * Save all encounters to localStorage, replacing existing data.
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
 * Save or update a single encounter in localStorage.
 * Automatically updates the updatedAt timestamp.
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
 * Delete an encounter by ID from localStorage.
 * Also clears the active encounter ID if deleting the currently active encounter.
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

