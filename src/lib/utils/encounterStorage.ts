/**
 * @fileoverview Encounter Planner Storage Utilities
 * @description Utilities for persisting and retrieving encounter data using the
 * multi-layer persistent storage abstraction (cookie-first, sessionStorage, localStorage).
 * Provides CRUD operations for encounters with automatic timestamp management and
 * debounced autosave support. All storage operations use the EncounterStorage enum
 * for consistent key naming. Large payloads (encounters array) use the ref strategy
 * via storePersistentDataRef/fetchPersistentDataRef; scalar IDs use storePersistentData.
 *
 * @module encounterStorage
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/enums/encounterPlanner EncounterStorage keys
 * @requires @/lib/types/encounterPlanner Type definitions for encounters and creatures
 * @requires @/lib/utils/storePersistentData Multi-layer persistence helpers
 * @requires @/lib/utils/fetchPersistentData Cookie-first read helper
 *
 * @example
 * ```typescript
 * // Create and save a new encounter
 * const encounter = createEmptyEncounter();
 * saveEncounter(encounter);
 * setActiveEncounterId(encounter.id);
 *
 * // Load active encounter
 * const active = getActiveEncounter();
 * ```
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import type {
    AffixEntry,
    CreatureEntry,
    Encounter,
} from '@/lib/types/encounterPlanner';
import { fetchPersistentData } from '@/lib/utils/fetchPersistentData';
import {
    fetchPersistentDataRef,
    removePersistentData,
    storePersistentData,
    storePersistentDataRef,
} from '@/lib/utils/storePersistentData';

export {
    createCreatureFromMonster,
    createEmptyCreature,
    createEmptyEncounter,
    createMultipleCreaturesFromMonster
} from './encounterFactory';

/**
 * Generate a unique ID for encounters or creatures using timestamp and random string.
 * Combines Date.now() with base36-encoded random value for collision resistance.
 *
 * @function generateId
 * @returns {string} Unique identifier in format "timestamp-randomString"
 *
 * @example
 * const id = generateId(); // "1734451200000-a3b5c7d9e"
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate d20 initiative modifier from dexterity ability score.
 * Uses standard formula: (ability - 10) / 2, rounded down.
 *
 * @function calculateInitiativeMod
 * @param {number} dex - Dexterity ability score (typically 1-30)
 * @returns {number} Initiative modifier (typically -5 to +10)
 *
 * @example
 * calculateInitiativeMod(10); // 0
 * calculateInitiativeMod(16); // +3
 * calculateInitiativeMod(8);  // -1
 */
export const calculateInitiativeMod = (dex: number): number => {
  return Math.floor((dex - 10) / 2);
};

/**
 * Migrate encounter data from old format to new format.
 * Handles backward compatibility for affixes stored as string[] → AffixEntry[].
 *
 * @function migrateEncounter
 * @param {any} encounter - Encounter data from localStorage (may be old format)
 * @returns {Encounter} Encounter with migrated data
 *
 * @description
 * Old format: affixes: string[] = ['Bloodthirsty', 'Crusading']
 * New format: affixes: AffixEntry[] = [{text: 'Bloodthirsty'}, {text: 'Crusading'}]
 * @deprecated Legacy migration path retained for reference; current encounter reads no longer invoke this helper.
 *
 * @example
 * const old = { creatures: [{ details: { affixes: ['Bloodthirsty'] } }] };
 * const new_ = migrateEncounter(old);
 * // Affixes now have shape { text: 'Bloodthirsty' }
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
 * Applies data migrations for backward compatibility with older encounter formats.
 *
 * @function getEncounters
 * @returns {Encounter[]} Array of all saved encounters, or empty array on error
 *
 * @description
 * Retrieval flow:
 * 1. Check for SSR context (returns empty array on server)
 * 2. Read raw JSON from localStorage
 * 3. Parse and validate as array
 * 4. Apply migrations to each encounter (e.g., affix format conversion)
 *
 * @example
 * const encounters = getEncounters();
 * console.log(`Found ${encounters.length} encounters`);
 */
export const getEncounters = (): Encounter[] => {
  if (typeof window === 'undefined') return [];

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
 *
 * @example
 * const activeId = getActiveEncounterId();
 * if (activeId) {
 *   const encounter = getEncounters().find(e => e.id === activeId);
 * }
 */
export const getActiveEncounterId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return fetchPersistentData(EncounterStorage.ActiveEncounterId);
};

/**
 * Set the active encounter ID in localStorage.
 * Pass null to clear the active encounter selection.
 *
 * @function setActiveEncounterId
 * @param {string | null} id - Encounter ID to set as active, or null to clear
 * @returns {void}
 *
 * @example
 * setActiveEncounterId(encounter.id); // Set active
 * setActiveEncounterId(null);         // Clear active
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
 * Combines getActiveEncounterId() with getEncounters() to find the full encounter object.
 *
 * @function getActiveEncounter
 * @returns {Encounter | null} Active encounter object, or null if none set/found
 *
 * @example
 * const active = getActiveEncounter();
 * if (active) {
 *   console.log(`Loaded: ${active.name}`);
 * }
 */
export const getActiveEncounter = (): Encounter | null => {
  const encounters = getEncounters();
  const activeId = getActiveEncounterId();

  if (!activeId) return null;

  return encounters.find((e) => e.id === activeId) || null;
};

/**
 * Save all encounters to localStorage, replacing existing data.
 * Handles JSON serialization and error logging.
 *
 * @function saveEncounters
 * @param {Encounter[]} encounters - Complete array of encounters to persist
 * @returns {void}
 *
 * @example
 * const encounters = getEncounters();
 * encounters.push(newEncounter);
 * saveEncounters(encounters);
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
 * Automatically updates the updatedAt timestamp. If encounter ID exists, updates it;
 * otherwise appends as new encounter.
 *
 * @function saveEncounter
 * @param {Encounter} encounter - Encounter to save (id must be set)
 * @returns {void}
 *
 * @example
 * const encounter = createEmptyEncounter();
 * encounter.name = "Boss Fight";
 * saveEncounter(encounter); // Creates new
 *
 * encounter.name = "Updated Boss Fight";
 * saveEncounter(encounter); // Updates existing
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
 *
 * @example
 * deleteEncounter(encounter.id);
 * // If this was active encounter, active ID is cleared
 */
export const deleteEncounter = (id: string): void => {
  const encounters = getEncounters();
  const filtered = encounters.filter((e) => e.id !== id);
  saveEncounters(filtered);

  if (getActiveEncounterId() === id) {
    setActiveEncounterId(null);
  }
};

/**
 * Export encounter to JSON string with pretty formatting.
 * Use for clipboard copy or file download.
 *
 * @function exportEncounter
 * @param {Encounter} encounter - Encounter to serialize
 * @returns {string} Formatted JSON string (2-space indentation)
 *
 * @example
 * const json = exportEncounter(encounter);
 * await navigator.clipboard.writeText(json);
 */
export const exportEncounter = (encounter: Encounter): string => {
  return JSON.stringify(encounter, null, 2);
};

/**
 * Import encounter from JSON string with validation.
 * Generates new ID to prevent conflicts with existing encounters.
 * Validates structure and ensures timestamps exist.
 *
 * @function importEncounter
 * @param {string} jsonString - JSON string to parse
 * @returns {Encounter} Parsed and validated encounter with new ID
 * @throws {Error} If JSON is invalid or structure doesn't match Encounter schema
 *
 * @example
 * try {
 *   const imported = importEncounter(jsonString);
 *   saveEncounter(imported);
 * } catch (error) {
 *   console.error('Import failed:', error);
 * }
 */
export const importEncounter = (jsonString: string): Encounter => {
  const encounter = JSON.parse(jsonString);

  if (!encounter.id || !encounter.name || !Array.isArray(encounter.creatures)) {
    throw new Error('Invalid encounter structure');
  }

  encounter.id = generateId();

  const now = new Date().toISOString();
  encounter.createdAt = encounter.createdAt || now;
  encounter.updatedAt = now;

  encounter.creatures.forEach((creature: CreatureEntry) => {
    if (!creature.id || !creature.name) {
      throw new Error('Invalid creature structure');
    }
  });

  return encounter;
};

/**
 * Roll 1d20 and add initiative modifier for creature initiative.
 * Uses standard d20 initiative rules.
 *
 * @function rollInitiative
 * @param {number} initiativeMod - Initiative modifier to add to roll
 * @returns {number} Total initiative (1d20 + modifier)
 *
 * @example
 * const init = rollInitiative(3); // Rolls 1d20+3
 * // Possible results: 4-23
 */
export const rollInitiative = (initiativeMod: number): number => {
  const d20 = Math.floor(Math.random() * 20) + 1;
  return d20 + initiativeMod;
};
