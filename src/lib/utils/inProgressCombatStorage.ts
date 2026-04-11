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

import type { CreatureEntry } from '@/lib/types/encounterPlanner';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import type { MonsterData } from '@/lib/utils/monsterCache';
import { applyHeroicAwakening } from './heroicAwakeningApply';
import {
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

export { applyHeroicAwakening } from './heroicAwakeningApply';

export {
    forceHeroicAwakening,
    forceHeroicAwakeningWithAffixes,
} from './heroicAwakeningForce';

export {
    generateUniqueAffixes,
    getDefaultDeedCount,
    getDefaultResistCount,
    parseMechanicsFromTags
} from './combatMechanics';

export {
    deleteInProgressCombat,
    exportInProgressCombat,
    getActiveInProgressCombatId,
    getInProgressCombat,
    getInProgressCombats,
    getNextActiveCombatantIndex,
    saveInProgressCombat,
    setActiveInProgressCombatId,
} from './inProgressCombatPersistence';

/**
 * Convert a base creature to an in-progress combatant.
 * Preserves heroic awakening state if the creature was already awakened.
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

  const ha = creature.heroicAwakening;

  return {
    id: creature.id,
    name: creature.name,
    hpCurrent: creature.hpCurrent,
    hpMax: ha?.hpOverride ?? creature.hpMax,
    hpMaxOverride: ha?.hpOverride ?? null,
    tempHp: creature.tempHp,
    ac: ha ? creature.ac + ha.bonuses.acBonus : creature.ac,
    stats: { ...creature.stats },
    conditions: creature.conditions.map((c) => ({ id: c.id, text: c.text })),
    initiativeValue: creature.initiativeValue,
    initiativeBonus: creature.initiativeBonus,
    proficiencyBonus: creature.proficiencyBonus,
    proficiencyBonusOverride: ha?.bonuses.proficiencyBonus ?? null,
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
    heroicAwakening: ha
      ? {
          ...ha,
          affixes: ha.affixes.map((a) => ({ ...a })),
          bonuses: { ...ha.bonuses },
        }
      : {
          fateDieResult: 0,
          heroicDc: 0,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
    mechanics,
    legendaryDeedsUsed: new Array(deedCount).fill(false),
    resistRemaining: resistCount,
    phaseDeeds: { wounded: false, bloodied: false, doomed: false },
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
 *
 * @param {InProgressCombat} combat - The in-progress combat snapshot
 * @returns {InProgressCombat} Updated combat with preserved active combatant
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
 * 3. Apply Heroic Awakening to non-awakened combatants (preserves manual awakenings)
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
    if (!combatant.heroicAwakening.awakened) {
      applyHeroicAwakening(combatant, combatant.crText, locale);
    }
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
 * Create multiple in-progress combatants from monster data for mid-combat addition.
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
