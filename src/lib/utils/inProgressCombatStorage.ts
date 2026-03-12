/**
 * @fileoverview In-Progress Combat Storage Utilities
 * @description Utilities for persisting and managing in-progress combat snapshots.
 * Separate from encounter planner storage to avoid mutating base encounters.
 *
 * @module inProgressCombatStorage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import type { CreatureEntry } from '@/lib/types/encounterPlanner';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import type { MonsterData } from '@/lib/utils/monsterCache';
import {
    applyHeroicAwakening,
    getDefaultDeedCount,
    getDefaultResistCount,
    parseMechanicsFromTags
} from './combatMechanics';
import {
    calculateInitiativeMod,
    createCreatureFromMonster,
    generateId,
    rollInitiative,
} from './encounterStorage';

export {
    applyHeroicAwakening,
    forceHeroicAwakening,
    generateUniqueAffixes,
    getDefaultDeedCount,
    getDefaultResistCount,
    parseMechanicsFromTags
} from './combatMechanics';

/**
 * Convert a base creature to an in-progress combatant.
 * Preserves heroic awakening state if the creature was already awakened in the planner.
 *
 * @function createInProgressCombatant
 * @param {CreatureEntry} creature - Base creature to convert
 * @returns {InProgressCombatant} Combat-ready combatant with preserved awakening state
 */
export const createInProgressCombatant = (
  creature: CreatureEntry,
): InProgressCombatant => {
  const mechanics = parseMechanicsFromTags(creature.tags);
  const deedCount = mechanics.legendaryDeed
    ? getDefaultDeedCount(creature.crText)
    : 0;
  const resistCount = mechanics.resist
    ? getDefaultResistCount(creature.crText)
    : 0;

  const hpMax = creature.heroicAwakening?.hpOverride ?? creature.hpMax;
  const hpCurrent = creature.heroicAwakening
    ? creature.hpCurrent
    : creature.hpCurrent;
  const ac = creature.heroicAwakening
    ? creature.ac + creature.heroicAwakening.bonuses.acBonus
    : creature.ac;
  const proficiencyBonusOverride =
    creature.heroicAwakening?.bonuses.proficiencyBonus ?? null;

  return {
    id: creature.id,
    name: creature.name,
    hpCurrent: hpCurrent,
    hpMax: hpMax,
    hpMaxOverride: creature.heroicAwakening?.hpOverride ?? null,
    tempHp: creature.tempHp,
    ac: ac,
    stats: { ...creature.stats },
    conditions: creature.conditions.map((c) => ({ id: c.id, text: c.text })),
    initiativeValue: creature.initiativeValue,
    initiativeBonus: creature.initiativeBonus,
    proficiencyBonus: creature.proficiencyBonus,
    proficiencyBonusOverride: proficiencyBonusOverride,
    speed: creature.speed,
    hpFormula: creature.hpFormula,
    details: {
      buffs: [...creature.details.buffs],
      items: [...creature.details.items],
      spells: creature.details.spells.map((s) => ({ slug: s.slug })),
      affixes: creature.details.affixes.map((a) => ({ ...a })),
    },
    slain: creature.slain ?? false,
    sessionOnly: false,
    sourceHref: creature.sourceHref,
    crText: creature.crText,
    heroicAwakening: creature.heroicAwakening
      ? {
          fateDieResult: creature.heroicAwakening.fateDieResult,
          heroicDc: creature.heroicAwakening.heroicDc,
          awakened: creature.heroicAwakening.awakened,
          tier: creature.heroicAwakening.tier,
          affixes: creature.heroicAwakening.affixes.map((a) => ({ ...a })),
          bonuses: {
            proficiencyBonus: creature.heroicAwakening.bonuses.proficiencyBonus,
            acBonus: creature.heroicAwakening.bonuses.acBonus,
            savingThrowBonus: creature.heroicAwakening.bonuses.savingThrowBonus,
          },
          hpOverride: creature.heroicAwakening.hpOverride,
        }
      : {
          fateDieResult: 0,
          heroicDc: 0,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: {
            proficiencyBonus: 0,
            acBonus: 0,
            savingThrowBonus: 0,
          },
          hpOverride: null,
        },
    mechanics,
    legendaryDeedsUsed: new Array(deedCount).fill(false),
    resistRemaining: resistCount,
    phaseDeeds: {
      wounded: false,
      bloodied: false,
      doomed: false,
    },
    locked: [],
  };
};

/**
 * Sort combatants by initiative descending with stable tie-breakers.
 *
 * @function sortCombatantsByInitiative
 * @param {InProgressCombatant[]} combatants - Array of combatants to sort
 * @returns {string[]} Sorted array of combatant IDs
 *
 * @description
 * Sorting priority:
 * 1. Initiative value (descending)
 * 2. Dexterity modifier (descending tie-breaker)
 * 3. Name alphabetically (final tie-breaker)
 */
export const sortCombatantsByInitiative = (
  combatants: InProgressCombatant[],
): string[] => {
  const sorted = [...combatants].sort((a, b) => {
    if ((b.initiativeValue || 0) !== (a.initiativeValue || 0)) {
      return (b.initiativeValue || 0) - (a.initiativeValue || 0);
    }
    const aDex = calculateInitiativeMod(a.stats.dex);
    const bDex = calculateInitiativeMod(b.stats.dex);
    if (bDex !== aDex) return bDex - aDex;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((c) => c.id);
};

/**
 * Resort combatants by initiative while preserving the active combatant index.
 * Recomputes turn order and updates activeTurnIndex to keep the same combatant active.
 * @param combat The in-progress combat snapshot
 * @returns Updated combat with new turn order and preserved active combatant
 */
export const resortCombatants = (
  combat: InProgressCombat,
): InProgressCombat => {
  const newTurnOrder = sortCombatantsByInitiative(combat.combatants);
  const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];
  const newActiveTurnIndex = newTurnOrder.indexOf(activeCombatantId);

  return {
    ...combat,
    turnOrder: newTurnOrder,
    activeTurnIndex: newActiveTurnIndex >= 0 ? newActiveTurnIndex : 0,
  };
};

/**
 * Create a fresh in-progress combat snapshot from a base encounter.
 *
 * @function createInProgressCombat
 * @param {object} encounter - Base encounter data
 * @param {string} encounter.id - Encounter ID
 * @param {string} encounter.name - Encounter name
 * @param {CreatureEntry[]} encounter.creatures - Array of creatures
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {InProgressCombat} Fresh combat snapshot
 *
 * @description
 * Combat creation flow:
 * 1. Convert creatures to combatants
 * 2. Roll initiative for combatants missing values
 * 3. Apply Heroic Awakening to each combatant
 * 4. Sort by initiative to establish turn order
 */
export const createInProgressCombat = (
  encounter: { id: string; name: string; creatures: CreatureEntry[] },
  locale: string = 'en',
): InProgressCombat => {
  const now = new Date().toISOString();

  const combatants = encounter.creatures.map((creature) =>
    createInProgressCombatant(creature),
  );

  for (const combatant of combatants) {
    if (combatant.initiativeValue === null) {
      combatant.initiativeValue = rollInitiative(combatant.initiativeBonus);
    }
  }

  for (const combatant of combatants) {
    applyHeroicAwakening(combatant, combatant.crText, locale);
  }

  const turnOrder = sortCombatantsByInitiative(combatants);

  return {
    id: generateId(),
    encounterId: encounter.id,
    encounterName: encounter.name,
    createdAt: now,
    startedAt: now,
    combatants,
    roundNumber: 1,
    activeTurnIndex: 0,
    turnOrder,
  };
};

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
const migrateCombatant = (combatant: any): InProgressCombatant => {
  if (!combatant.mechanics) {
    combatant.mechanics = {
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    };
  }

  if (!Array.isArray(combatant.legendaryDeedsUsed)) {
    combatant.legendaryDeedsUsed = combatant.mechanics.legendaryDeed
      ? [false, false, false]
      : [];
  }

  if (typeof combatant.resistRemaining !== 'number') {
    combatant.resistRemaining = combatant.mechanics.resist ? 3 : 0;
  }

  if (!combatant.phaseDeeds) {
    combatant.phaseDeeds = {
      wounded: false,
      bloodied: false,
      doomed: false,
    };
  }

  return combatant as InProgressCombatant;
};

/**
 * Migrate an in-progress combat to include new fields if missing.
 * Applies combatant migrations to ensure backward compatibility.
 *
 * @function migrateInProgressCombat
 * @param {any} combat - Possibly outdated combat data
 * @returns {InProgressCombat} Migrated combat with all required fields
 */
const migrateInProgressCombat = (combat: any): InProgressCombat => {
  return {
    ...combat,
    combatants: combat.combatants.map(migrateCombatant),
  };
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
    const data = localStorage.getItem(EncounterStorage.InProgressCombats);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map(migrateInProgressCombat);
  } catch (error) {
    logger.warning('Error loading in-progress combats from localStorage', {
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

    localStorage.setItem(
      EncounterStorage.InProgressCombats,
      JSON.stringify(combats),
    );
  } catch (error) {
    logger.error('Error saving in-progress combat to localStorage', {
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
    localStorage.setItem(
      EncounterStorage.InProgressCombats,
      JSON.stringify(filtered),
    );
  } catch (error) {
    logger.error('Error deleting in-progress combat from localStorage', {
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
  return localStorage.getItem(EncounterStorage.ActiveCombatId);
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
    localStorage.removeItem(EncounterStorage.ActiveCombatId);
  } else {
    localStorage.setItem(EncounterStorage.ActiveCombatId, id);
  }
};

/**
 * Export an in-progress combat as JSON
 */
export const exportInProgressCombat = (combat: InProgressCombat): string => {
  return JSON.stringify(combat, null, 2);
};

/**
 * Get next non-slain combatant for turn order
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

/**
 * Create multiple in-progress combatants from monster data for mid-combat addition.
 * Each combatant gets a unique ID and is marked as session-only.
 *
 * @function createMultipleCombatantsFromMonster
 * @param {MonsterData} monsterData - Monster metadata from API
 * @param {string} locale - Locale for wiki links
 * @param {number} quantity - Number of combatants to create (clamped 1–20)
 * @returns {InProgressCombatant[]} Array of session-only combatants
 */
export const createMultipleCombatantsFromMonster = (
  monsterData: MonsterData,
  locale: string,
  quantity: number,
): InProgressCombatant[] => {
  const safeQuantity = Math.max(1, Math.min(20, Math.floor(quantity)));
  const combatants: InProgressCombatant[] = [];

  for (let i = 0; i < safeQuantity; i++) {
    const baseCreature = createCreatureFromMonster(monsterData, locale);
    const newCombatant = createInProgressCombatant(baseCreature);
    newCombatant.sessionOnly = true;
    combatants.push(newCombatant);
  }

  return combatants;
};
