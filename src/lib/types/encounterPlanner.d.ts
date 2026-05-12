/**
 * @fileoverview Encounter Planner Types - TypeScript interfaces for encounter persistence
 * @description Type definitions for encounter planner data structures. Defines the complete
 * data model for encounters, creatures, conditions, and spell references.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/lib/types/encounterPlanner
 */

import type { HeroicAwakeningState } from './inProgressCombat';

/**
 * Condition entry in a creature's condition tracker.
 * 
 * @interface ConditionEntry
 * @property {string} id - Unique identifier for the condition instance
 * @property {string} text - Display text describing the condition
 */
export interface ConditionEntry {
  id: string;
  text: string;
}

/**
 * Reference to a spell using only its slug identifier.
 * Full metadata is loaded lazily from spell metadata files.
 * 
 * @interface SpellRef
 * @property {string} slug - URL-safe spell identifier for API lookups
 */
export interface SpellRef {
  slug: string;
}

/**
 * Ability scores for a creature.
 * Standard d20 ability score block.
 * 
 * @interface CreatureStats
 * @property {number} str - Strength score (1-30)
 * @property {number} dex - Dexterity score (1-30)
 * @property {number} con - Constitution score (1-30)
 * @property {number} int - Intelligence score (1-30)
 * @property {number} wis - Wisdom score (1-30)
 * @property {number} cha - Charisma score (1-30)
 */
export interface CreatureStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/**
 * Affix entry with optional wiki source link.
 * Affixes can be plain text or backed by metadata with a wiki link.
 * 
 * @interface AffixEntry
 * @property {string} text - Display name of the affix
 * @property {Object} [source] - Optional source reference
 * @property {string} [source.slug] - URL-safe identifier for API lookup
 * @property {string} [source.href] - Direct wiki link URL
 */
export interface AffixEntry {
  text: string;
  source?: {
    slug?: string;
    href?: string;
  };
}

/**
 * Details section for a creature containing buffs, items, spells, and affixes.
 * 
 * @interface CreatureDetails
 * @property {string[]} buffs - Active buff names
 * @property {string[]} items - Equipped item names
 * @property {SpellRef[]} spells - Prepared spell references
 * @property {AffixEntry[]} affixes - Applied affixes (heroic or template)
 */
export interface CreatureDetails {
  buffs: string[];
  items: string[];
  spells: SpellRef[];
  affixes: AffixEntry[];
}

/**
 * Single creature entry in an encounter.
 * 
 * @interface CreatureEntry
 * @property {string} id - Unique creature identifier
 * @property {string} name - Display name
 * @property {number} hpCurrent - Current hit points
 * @property {number} hpMax - Maximum hit points
 * @property {number|null} tempHp - Temporary hit points
 * @property {number} ac - Armor class
 * @property {CreatureStats} stats - Ability scores
 * @property {ConditionEntry[]} conditions - Active conditions
 * @property {number|null} initiativeValue - Rolled initiative (null if not yet rolled)
 * @property {number} initiativeBonus - Initiative modifier (includes DEX and features)
 * @property {number|null} proficiencyBonus - Proficiency bonus (null for manual entries)
 * @property {string|null} speed - Movement speed string (e.g., "30 ft., fly 60 ft.")
 * @property {string|null} hpFormula - Hit dice formula (e.g., "10d10+50")
 * @property {CreatureDetails} details - Extended details (buffs, items, spells, affixes)
 * @property {boolean} [slain=false] - Whether creature is marked as slain
 * @property {string} [sourceHref] - Wiki link for library-imported creatures
 * @property {string} [crText] - Challenge rating display text (e.g., "CR 5")
 * @property {string[]} [tags] - Monster metadata tags for mechanic flags
 */
export interface CreatureEntry {
  id: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  tempHp: number | null;
  ac: number;
  stats: CreatureStats;
  conditions: ConditionEntry[];
  initiativeValue: number | null;
  initiativeBonus: number;
  proficiencyBonus: number | null;
  speed: string | null;
  hpFormula: string | null;
  details: CreatureDetails;
  slain?: boolean;
  sourceHref?: string;
  crText?: string;
  tags?: string[];
  heroicAwakening?: HeroicAwakeningState;
}

/**
 * Complete encounter data structure.
 * 
 * @interface Encounter
 * @property {string} id - Unique encounter identifier
 * @property {string} name - Display name
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {CreatureEntry[]} creatures - All creatures in the encounter
 */
export interface Encounter {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  creatures: CreatureEntry[];
}

/**
 * Spell metadata structure for dropdown display.
 * Minimal interface containing only fields needed for spell selection UI.
 * 
 * @interface SpellMetadata
 * @property {string} slug - URL-safe identifier
 * @property {string} title - Display name
 * @property {number} level - Spell level (0 for cantrips)
 * @property {string} school - Spell school (e.g., "Evocation")
 * @property {string[]} castingTime - Action economy types (e.g., ["action", "reaction"])
 * @property {string} castingTimeRaw - Original casting time text
 * @property {boolean} concentration - Whether spell requires concentration
 */
export interface SpellMetadata {
  slug: string;
  title: string;
  level: number;
  school: string;
  castingTime: string[];
  castingTimeRaw: string;
  concentration: boolean;
}
