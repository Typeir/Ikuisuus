/**
 * @fileoverview Encounter Planner Storage Utilities
 * @description Utilities for persisting and retrieving encounter data using localStorage.
 * Provides CRUD operations for encounters with automatic timestamp management and
 * debounced autosave support. All storage operations use the EncounterStorage enum
 * for consistent key naming.
 *
 * @module encounterStorage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/enums/encounterPlanner EncounterStorage keys for localStorage
 * @requires @/lib/types/encounterPlanner Type definitions for encounters and creatures
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
  CreatureStats,
  Encounter,
} from '@/lib/types/encounterPlanner';

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
 * Calculate D&D 5e initiative modifier from dexterity ability score.
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
 * Create a new empty creature entry with default values.
 * All ability scores default to 10 (modifier +0), HP and AC default to 10.
 * Initiative modifier is recalculated when dexterity changes.
 *
 * @function createEmptyCreature
 * @returns {CreatureEntry} Newly created creature with default values
 *
 * @example
 * const creature = createEmptyCreature();
 * // { id: "...", name: "New Creature", hpCurrent: 10, hpMax: 10, ... }
 */
export const createEmptyCreature = (): CreatureEntry => {
  const stats: CreatureStats = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  const initiativeBonus = calculateInitiativeMod(stats.dex);

  return {
    id: generateId(),
    name: 'New Creature',
    hpCurrent: 10,
    hpMax: 10,
    tempHp: null,
    ac: 10,
    stats,
    conditions: [],
    initiativeValue: null,
    initiativeBonus,
    proficiencyBonus: null,
    speed: null,
    hpFormula: null,
    details: {
      buffs: [],
      items: [],
      spells: [],
      affixes: [],
    },
  };
};

/**
 * Create a new empty encounter with default name and one creature.
 * Automatically sets creation and update timestamps to current ISO time.
 *
 * @function createEmptyEncounter
 * @returns {Encounter} Newly created encounter with one default creature
 *
 * @example
 * const encounter = createEmptyEncounter();
 * // { id: "...", name: "New Encounter", creatures: [defaultCreature], ... }
 */
export const createEmptyEncounter = (): Encounter => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'New Encounter',
    createdAt: now,
    updatedAt: now,
    creatures: [],
  };
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
    const data = localStorage.getItem(EncounterStorage.Encounters);
    if (!data) return [];

    const parsed = JSON.parse(data);
    const encounters = Array.isArray(parsed) ? parsed : [];

    return encounters.map(migrateEncounter);
  } catch (error) {
    logger.warning('Error loading encounters from localStorage', {
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
  return localStorage.getItem(EncounterStorage.ActiveEncounterId);
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
    localStorage.removeItem(EncounterStorage.ActiveEncounterId);
  } else {
    localStorage.setItem(EncounterStorage.ActiveEncounterId, id);
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
    localStorage.setItem(
      EncounterStorage.Encounters,
      JSON.stringify(encounters),
    );
  } catch (error) {
    logger.error('Error saving encounters to localStorage', {
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

  // Update timestamp
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

  // Clear active ID if deleting active encounter
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

  // Validate structure
  if (!encounter.id || !encounter.name || !Array.isArray(encounter.creatures)) {
    throw new Error('Invalid encounter structure');
  }

  // Generate new ID to avoid conflicts
  encounter.id = generateId();

  // Ensure timestamps exist
  const now = new Date().toISOString();
  encounter.createdAt = encounter.createdAt || now;
  encounter.updatedAt = now;

  // Validate creature structure
  encounter.creatures.forEach((creature: any) => {
    if (!creature.id || !creature.name) {
      throw new Error('Invalid creature structure');
    }
  });

  return encounter;
};

/**
 * Create a new creature entry from monster library metadata.
 * Hydrates a CreatureEntry with combat-relevant data from monster stat block.
 * Generates new unique runtime ID to allow multiple instances.
 * Stores sourceHref for wiki link rendering and extracts CR/proficiency/speed from metadata.
 *
 * @function createCreatureFromMonster
 * @param {any} monsterData - Full monster metadata object from library
 * @param {string} locale - Current locale for generating wiki URL
 * @returns {CreatureEntry} New creature entry initialized with monster stats
 *
 * @example
 * const monster = await fetch('/api/monsters/ancient-red-dragon').then(r => r.json());
 * const creature = createCreatureFromMonster(monster, 'en');
 * // { id: "unique-runtime-id", name: "Ancient Red Dragon", hp: 546, ac: 22, sourceHref: "/en/library/monsters/ancient-red-dragon", ... }
 */
export const createCreatureFromMonster = (
  monsterData: any,
  locale: string = 'en',
): CreatureEntry => {
  // Extract HP from metadata (average value)
  const hp = monsterData.hp?.average || 10;

  // Extract AC from metadata (value)
  const ac = monsterData.ac?.value || 10;

  // Extract ability scores with fallback to 10
  const stats: CreatureStats = {
    str: monsterData.abilities?.str?.score || 10,
    dex: monsterData.abilities?.dex?.score || 10,
    con: monsterData.abilities?.con?.score || 10,
    int: monsterData.abilities?.int?.score || 10,
    wis: monsterData.abilities?.wis?.score || 10,
    cha: monsterData.abilities?.cha?.score || 10,
  };

  // Calculate initiative modifier from dexterity
  const initiativeBonus = calculateInitiativeMod(stats.dex);

  // Generate wiki source URL from metadata link field
  const sourceHref = monsterData.link
    ? `/${locale}${monsterData.link}`
    : undefined;

  // Extract CR as display text
  const crText = monsterData.cr ? `CR ${monsterData.cr}` : undefined;

  // Extract proficiency bonus from metadata
  const proficiencyBonus = monsterData.proficiencyBonus || null;

  // Extract speed (parsed modes or raw string)
  const speed = monsterData.speed?.raw || null;

  // Extract HP formula
  const hpFormula = monsterData.hp?.formula || null;

  // Extract tags for mechanics flags
  const tags = Array.isArray(monsterData.tags) ? monsterData.tags : [];

  return {
    id: generateId(),
    name: monsterData.title || 'Imported Creature',
    hpCurrent: hp,
    hpMax: hp,
    tempHp: null,
    ac,
    stats,
    conditions: [],
    initiativeValue: null,
    initiativeBonus,
    proficiencyBonus,
    speed,
    hpFormula,
    details: {
      buffs: [],
      items: [],
      spells: [],
      affixes: [],
    },
    sourceHref,
    crText,
    tags,
  };
};

/**
 * Create multiple creature entries from monster library metadata.
 * Each creature gets a unique runtime ID to prevent conflicts.
 *
 * @function createMultipleCreaturesFromMonster
 * @param {any} monsterData - Full monster metadata object from library
 * @param {string} locale - Current locale for generating wiki URL
 * @param {number} quantity - Number of creatures to create
 * @returns {CreatureEntry[]} Array of new creature entries initialized with monster stats
 *
 * @example
 * const monster = await fetch('/api/monsters/goblin').then(r => r.json());
 * const creatures = createMultipleCreaturesFromMonster(monster, 'en', 4);
 * // Returns 4 goblins with unique IDs
 */
export const createMultipleCreaturesFromMonster = (
  monsterData: any,
  locale: string = 'en',
  quantity: number = 1,
): CreatureEntry[] => {
  const safeQuantity = Math.max(1, Math.min(20, Math.floor(quantity)));
  const creatures: CreatureEntry[] = [];

  for (let i = 0; i < safeQuantity; i++) {
    creatures.push(createCreatureFromMonster(monsterData, locale));
  }

  return creatures;
};

/**
 * Roll 1d20 and add initiative modifier for creature initiative.
 * Uses standard D&D 5e initiative rules.
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
