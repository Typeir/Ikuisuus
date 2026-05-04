/**
 * @fileoverview Encounter Factory Utilities
 * @description Factory functions for creating creature and encounter objects.
 * Separated from storage to isolate object construction from persistence concerns.
 *
 * @module encounterFactory
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    CreatureEntry,
    CreatureStats,
    Encounter,
} from '@/lib/types/encounterPlanner';
import { calculateInitiativeMod, generateId } from './encounterStorage';

/**
 * Partial shape for monster metadata as provided by the content API
 * Only fields used by the encounter factory are declared here.
 */
type MonsterLibraryData = {
  hp?: { average?: number; formula?: string } | null;
  ac?: { value?: number } | null;
  scores?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  } | null;
  link?: string;
  title?: string;
  cr?: string | number;
  proficiencyBonus?: number | null;
  speed?: { raw?: string } | string | null;
  tags?: string[];
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
 * Create a new empty encounter with default name and no creatures.
 * Automatically sets creation and update timestamps to current ISO time.
 *
 * @function createEmptyEncounter
 * @returns {Encounter} Newly created encounter
 *
 * @example
 * const encounter = createEmptyEncounter();
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
 * Create a new creature entry from monster library metadata.
 * Hydrates a CreatureEntry with combat-relevant data from the monster stat block.
 * Generates a new unique runtime ID to allow multiple instances.
 *
 * @function createCreatureFromMonster
 * @param {any} monsterData - Full monster metadata object from library
 * @param {string} locale - Current locale for generating wiki URL
 * @returns {CreatureEntry} New creature entry initialized with monster stats
 *
 * @example
 * const monster = await fetch('/api/monsters/ancient-red-dragon').then(r => r.json());
 * const creature = createCreatureFromMonster(monster, 'en');
 */
export const createCreatureFromMonster = (
  monsterData: MonsterLibraryData,
  locale: string = 'en',
): CreatureEntry => {
  const hp = monsterData.hp?.average || 10;
  const ac = monsterData.ac?.value || 10;

  const stats: CreatureStats = {
    str: monsterData.scores?.str || 10,
    dex: monsterData.scores?.dex || 10,
    con: monsterData.scores?.con || 10,
    int: monsterData.scores?.int || 10,
    wis: monsterData.scores?.wis || 10,
    cha: monsterData.scores?.cha || 10,
  };

  const initiativeBonus = calculateInitiativeMod(stats.dex);
  const sourceHref = monsterData.link
    ? `/${locale}${monsterData.link}`
    : undefined;
  const crText = monsterData.cr ? `CR ${monsterData.cr}` : undefined;
  const proficiencyBonus = monsterData.proficiencyBonus || null;
  const speed =
    typeof monsterData.speed === 'string'
      ? monsterData.speed
      : monsterData.speed?.raw || null;
  const hpFormula = monsterData.hp?.formula || null;
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
 */
export const createMultipleCreaturesFromMonster = (
  monsterData: MonsterLibraryData,
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
