/**
 * @fileoverview Encounter Factory Utilities
 * @description Constructs creature and encounter objects.
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
} from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { calculateInitiativeMod, generateId } from '../../domain/shared/utils';

/**
 * Partial shape for monster metadata as provided by the content API. Only fields used by the factory.
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
  tierBonus?: number | null;
  speed?: { raw?: string } | string | null;
  tags?: string[];
};

/**
 * Creates an empty creature entry with default values: ability scores, HP, and AC of 10.
 *
 * @function createEmptyCreature
 * @returns {CreatureEntry} Creature with default values
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
    tierBonus: null,
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
 * Creates an empty encounter with default name and no creatures. Sets creation and update timestamps to the current ISO time.
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
 * Creates a creature entry from monster library metadata. Generates a new runtime ID per call.
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
  const tierBonus = monsterData.tierBonus || null;
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
    tierBonus,
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
 * Creates creature entries from monster library metadata. Quantity is clamped to 1..20.
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
