/**
 * @fileoverview Shared Game Data Types and Loader
 * @description Typed interface for scripts/core/shared-data.json and a loader usable in build-time scripts and Next.js runtime.
 *
 * @module scripts/metadata/sharedData
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
 * @property {Record<string, string[]>} [damageStrata] - Damage types grouped by stratum
 */
export interface GameDataSection {
  damageTypes: string[];
  damageStrata?: Record<string, string[]>;
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
 * One aspect group in the closed vocabulary.
 *
 * A `meta:`-prefixed group is indexed and searchable but never drawn in prose.
 * Values are declared literally or borrowed via `valuesFrom`; references resolve
 * one level deep and never chain.
 *
 * @property {"*" | string[]} scope - Content types carrying the group, or `"*"` for all
 * @property {string[]} [values] - Literal value list
 * @property {string[]} [valuesFrom] - `section.key` paths, or a sibling group name, to borrow values from
 * @property {boolean} [open] - Group accepts any value; excluded from closed-set validation
 * @property {string} [rule] - Route of the rule page defining the group, pinned first in aspect searches
 */
export interface AspectGroup {
  scope: '*' | string[];
  values?: string[];
  valuesFrom?: string[];
  open?: boolean;
  rule?: string;
}

/**
 * The closed aspect vocabulary, keyed by group name without its trailing colon.
 */
export type AspectSection = Record<string, AspectGroup>;

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
  aspects: AspectSection;
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
 * Clears the cached shared data.
 */
export function clearSharedDataCache(): void {
  cached = null;
}

/* ──────────────────────────  Aspects  ─────────────────────────────── */

/**
 * Normalises a borrowed value to kebab-case, the form aspect values use.
 *
 * @param {string} value - A value from a borrowed shared-data list
 * @returns {string} The kebab-case aspect form
 */
export function toAspectValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Whether a group applies to a given content type.
 *
 * @param {SharedData} sharedData - Loaded shared data
 * @param {string} group - Group name without its trailing colon
 * @param {string} contentType - The `contentType` frontmatter value
 * @returns {boolean} True when the group is universal or lists this content type
 */
export function aspectGroupAppliesTo(
  sharedData: SharedData,
  group: string,
  contentType: string,
): boolean {
  const definition = sharedData.aspects[group];
  if (!definition) return false;
  return definition.scope === '*' || definition.scope.includes(contentType);
}

/**
 * Splits an aspect into its group and value on the last colon, so that both
 * `damage:fire` and `meta:source:official` yield a usable pair.
 *
 * @param {string} aspect - A full aspect token
 * @returns {{ group: string; value: string } | null} The pair, or null when there is no colon
 */
export function parseAspect(
  aspect: string,
): { group: string; value: string } | null {
  const boundary = aspect.lastIndexOf(':');
  if (boundary <= 0 || boundary === aspect.length - 1) return null;
  return {
    group: aspect.slice(0, boundary),
    value: aspect.slice(boundary + 1),
  };
}

/**
 * Whether an aspect is internal, and therefore indexed but never drawn in prose.
 *
 * @param {string} aspect - A full aspect token
 * @returns {boolean} True for `meta:`-prefixed aspects
 */
export function isInternalAspect(aspect: string): boolean {
  return aspect.startsWith('meta:');
}
