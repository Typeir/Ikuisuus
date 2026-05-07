/**
 * @fileoverview In-Progress Combat Persistence
 * @description Multi-layer persistent storage CRUD, migration, and query helpers
 * for in-progress combat snapshots. Large-payload arrays (combats) use the ref
 * strategy via storePersistentDataRef/fetchPersistentDataRef; scalar IDs use
 * storePersistentData/fetchPersistentData/removePersistentData.
 *
 * @module inProgressCombatPersistence
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/enums/encounterPlanner EncounterStorage keys
 * @requires @/lib/utils/storePersistentData Multi-layer persistence helpers
 * @requires @/lib/utils/fetchPersistentData Cookie-first read helper
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import { fetchPersistentData } from '@/lib/utils/fetchPersistentData';
import {
    fetchPersistentDataRef,
    removePersistentData,
    storePersistentData,
    storePersistentDataRef,
} from '@/lib/utils/storePersistentData';

/**
 * Migrate a combatant to include new mechanics fields if missing.
 * Provides backward compatibility for saved combats from before the mechanics update.
 *
 * @function migrateCombatant
 * @param {any} combatant - Possibly outdated combatant data
 * @returns {InProgressCombatant} Migrated combatant with all required fields
 *
 * @description
 * Migration steps:
 * 1. Add mechanics object if missing (all false)
 * 2. Add legendaryDeedsUsed array if missing (empty or 3 slots)
 * 3. Add resistRemaining count if missing (0 or 3)
 * 4. Add phaseDeeds tracking if missing
 */
const migrateCombatant = (combatant: unknown): InProgressCombatant => {
  const typedCombatant =
    typeof combatant === 'object' && combatant !== null
      ? (combatant as Partial<InProgressCombatant>)
      : {};

  if (!typedCombatant.mechanics) {
    typedCombatant.mechanics = {
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    };
  }

  if (!Array.isArray(typedCombatant.legendaryDeedsUsed)) {
    typedCombatant.legendaryDeedsUsed = typedCombatant.mechanics.legendaryDeed
      ? [false, false, false]
      : [];
  }

  if (typeof typedCombatant.resistRemaining !== 'number') {
    typedCombatant.resistRemaining = typedCombatant.mechanics.resist ? 3 : 0;
  }

  if (!typedCombatant.phaseDeeds) {
    typedCombatant.phaseDeeds = {
      wounded: false,
      bloodied: false,
      doomed: false,
    };
  }

  return typedCombatant as InProgressCombatant;
};

/**
 * Migrate an in-progress combat to include new fields if missing.
 * Applies combatant migrations to ensure backward compatibility.
 *
 * @function migrateInProgressCombat
 * @param {any} combat - Possibly outdated combat data
 * @returns {InProgressCombat} Migrated combat with all required fields
 */
const migrateInProgressCombat = (combat: unknown): InProgressCombat => {
  const typedCombat =
    typeof combat === 'object' && combat !== null
      ? (combat as Partial<InProgressCombat>)
      : {};

  const combatants = Array.isArray(typedCombat.combatants)
    ? typedCombat.combatants.map(migrateCombatant)
    : [];

  return {
    ...typedCombat,
    combatants,
  } as InProgressCombat;
};

/**
 * Get all in-progress combats from localStorage.
 * Applies migrations for backward compatibility.
 *
 * @function getInProgressCombats
 * @returns {InProgressCombat[]} Array of in-progress combats (empty if SSR or error)
 */
export const getInProgressCombats = (): InProgressCombat[] => {
  if (typeof window === 'undefined') return [];

  try {
    const data = fetchPersistentDataRef(EncounterStorage.InProgressCombats);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map(migrateInProgressCombat);
  } catch (error) {
    logger.warning('Error loading in-progress combats from storage', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Get a single in-progress combat by ID.
 *
 * @function getInProgressCombat
 * @param {string} id - Combat ID to find
 * @returns {InProgressCombat|null} Combat if found, null otherwise
 */
export const getInProgressCombat = (id: string): InProgressCombat | null => {
  const combats = getInProgressCombats();
  return combats.find((c) => c.id === id) || null;
};

/**
 * Save an in-progress combat to localStorage.
 * Updates existing or appends new combat.
 *
 * @function saveInProgressCombat
 * @param {InProgressCombat} combat - Combat to save
 * @returns {void}
 */
export const saveInProgressCombat = (combat: InProgressCombat): void => {
  if (typeof window === 'undefined') return;

  try {
    const combats = getInProgressCombats();
    const index = combats.findIndex((c) => c.id === combat.id);

    if (index >= 0) {
      combats[index] = combat;
    } else {
      combats.push(combat);
    }

    storePersistentDataRef(
      EncounterStorage.InProgressCombats,
      JSON.stringify(combats),
    );
  } catch (error) {
    logger.error('Error saving in-progress combat to storage', {
      error: error instanceof Error ? error.message : String(error),
      combatId: combat.id,
    });
  }
};

/**
 * Delete an in-progress combat from localStorage.
 *
 * @function deleteInProgressCombat
 * @param {string} id - Combat ID to delete
 * @returns {void}
 */
export const deleteInProgressCombat = (id: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const combats = getInProgressCombats();
    const filtered = combats.filter((c) => c.id !== id);
    storePersistentDataRef(
      EncounterStorage.InProgressCombats,
      JSON.stringify(filtered),
    );
  } catch (error) {
    logger.error('Error deleting in-progress combat from storage', {
      error: error instanceof Error ? error.message : String(error),
      combatId: id,
    });
  }
};

/**
 * Get the currently active in-progress combat ID from localStorage.
 *
 * @function getActiveInProgressCombatId
 * @returns {string|null} Active combat ID or null if none/SSR
 */
export const getActiveInProgressCombatId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return fetchPersistentData(EncounterStorage.ActiveCombatId);
};

/**
 * Set or clear the active in-progress combat ID in localStorage.
 *
 * @function setActiveInProgressCombatId
 * @param {string|null} id - Combat ID to set as active, or null to clear
 * @returns {void}
 */
export const setActiveInProgressCombatId = (id: string | null): void => {
  if (typeof window === 'undefined') return;
  if (id === null) {
    removePersistentData(EncounterStorage.ActiveCombatId);
  } else {
    storePersistentData(EncounterStorage.ActiveCombatId, id);
  }
};

/**
 * Export an in-progress combat as JSON
 *
 * @function exportInProgressCombat
 * @param {InProgressCombat} combat - Combat to export
 * @returns {string} Formatted JSON string
 */
export const exportInProgressCombat = (combat: InProgressCombat): string => {
  return JSON.stringify(combat, null, 2);
};

/**
 * Get next non-slain combatant for turn order
 *
 * @function getNextActiveCombatantIndex
 * @param {InProgressCombatant[]} combatants - All combatants
 * @param {string[]} turnOrder - Ordered combatant IDs
 * @param {number} currentIndex - Current active index
 * @returns {number} Next active combatant index
 */
export const getNextActiveCombatantIndex = (
  combatants: InProgressCombatant[],
  turnOrder: string[],
  currentIndex: number,
): number => {
  const nonSlainIds = turnOrder.filter((id) => {
    const combatant = combatants.find((c) => c.id === id);
    return combatant && !combatant.slain;
  });

  if (nonSlainIds.length === 0) return currentIndex;

  const currentId = turnOrder[currentIndex];
  const currentIndexInNonSlain = nonSlainIds.indexOf(currentId);

  const nextIndex = (currentIndexInNonSlain + 1) % nonSlainIds.length;
  const nextId = nonSlainIds[nextIndex];

  return turnOrder.indexOf(nextId);
};
