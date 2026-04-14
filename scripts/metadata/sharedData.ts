/**
 * @fileoverview Shared Game Data Types and Loader
 * @description Typed interface for scripts/core/shared-data.json and a loader
 * function that works both at build-time (scripts) and runtime (Next.js).
 *
 * @module lib/metadata/sharedData
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { readFile } from 'fs/promises';
import path from 'path';

/* ──────────────────────────  Types  ──────────────────────────────── */

/**
 * Ability score reference (short + long name).
 *
 * @property {string} short - Three-letter abbreviation (e.g. "str")
 * @property {string} long - Full name (e.g. "strength")
 */
export interface AbilityRef {
  short: string;
  long: string;
}

/**
 * Rarity threshold mapping from CR to rarity tag.
 *
 * @property {number} minCR - Minimum challenge rating for this tier
 * @property {string} tag - Tag string (e.g. "rarity:legendary")
 */
export interface RarityThreshold {
  minCR: number;
  tag: string;
}

/**
 * Game rules data (creature stats, damage types, conditions, etc.)
 *
 * @property {string[]} damageTypes - All recognized damage types
 * @property {string[]} conditions - All recognized conditions
 * @property {AbilityRef[]} abilities - Six ability score references
 * @property {string[]} sizes - Creature size categories
 * @property {string[]} creatureTypes - All creature type categories
 * @property {string[]} senses - Special sense types
 * @property {string[]} movementTypes - Movement mode types
 * @property {string[]} mechanicTypes - Mechanic keyword types
 */
export interface GameDataSection {
  damageTypes: string[];
  conditions: string[];
  abilities: AbilityRef[];
  sizes: string[];
  creatureTypes: string[];
  senses: string[];
  movementTypes: string[];
  mechanicTypes: string[];
}

/**
 * Item-related data (rarities, weapon types, properties, etc.)
 *
 * @property {string[]} rarities - Item rarity tiers
 * @property {string[]} baseCategoryTypes - Base item categories
 * @property {string[]} itemTypes - All item type keywords
 * @property {string[]} weaponTypes - Weapon subtypes
 * @property {string[]} armorTypes - Armor subtypes
 * @property {string[]} clothingTypes - Clothing subtypes
 * @property {string[]} weaponProperties - Weapon property keywords
 * @property {string[]} masteryProperties - Weapon mastery properties
 */
export interface ItemDataSection {
  rarities: string[];
  baseCategoryTypes: string[];
  itemTypes: string[];
  weaponTypes: string[];
  armorTypes: string[];
  clothingTypes: string[];
  weaponProperties: string[];
  masteryProperties: string[];
}

/**
 * Spell-related data.
 *
 * @property {string[]} schools - Schools of magic
 * @property {string[]} qualities - Quality tiers for high-level spells
 */
export interface SpellDataSection {
  schools: string[];
  qualities: string[];
}

/**
 * World lore data.
 *
 * @property {string[]} factions - Known faction names
 * @property {string[]} locations - Known location names
 * @property {string[]} themes - Thematic keywords
 */
export interface WorldDataSection {
  factions: string[];
  locations: string[];
  themes: string[];
}

/**
 * Taxonomy and classification data.
 *
 * @property {string[]} tagCategories - Valid tag category prefixes
 * @property {RarityThreshold[]} rarityThresholds - CR-to-rarity mappings (descending order)
 */
export interface TaxonomySection {
  tagCategories: string[];
  rarityThresholds: RarityThreshold[];
}

/**
 * Regex pattern templates stored in shared data.
 *
 * @property {Record<string, string>} regexPatterns - Named regex pattern strings
 */
export interface PatternsSection {
  regexPatterns: Record<string, string>;
}

/**
 * Complete shared data schema.
 */
export interface SharedData {
  gameData: GameDataSection;
  itemData: ItemDataSection;
  spellData: SpellDataSection;
  worldData: WorldDataSection;
  taxonomies: TaxonomySection;
  patterns: PatternsSection;
}

/* ──────────────────────────  Loader  ──────────────────────────────── */

/** @type {SharedData | null} Cached shared data instance */
let cached: SharedData | null = null;

/**
 * Loads shared data from the canonical JSON file with caching.
 * The file lives at `scripts/core/shared-data.json` relative to project root.
 *
 * @returns {Promise<SharedData>} The shared data object
 * @throws {Error} If the file cannot be read or parsed
 */
export async function loadSharedData(): Promise<SharedData> {
  if (cached) return cached;

  const dataPath = path.resolve(
    process.cwd(),
    'scripts',
    'core',
    'shared-data.json',
  );
  const raw = await readFile(dataPath, 'utf8');
  cached = JSON.parse(raw) as SharedData;
  return cached;
}

/**
 * Clears the cached shared data (useful for testing).
 */
export function clearSharedDataCache(): void {
  cached = null;
}
