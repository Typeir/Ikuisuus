/**
 * @fileoverview Table Constants - Sort orders and display labels for metadata tables
 * @description Defines standardized sorting sequences for item rarities, creature sizes,
 * and spell levels. Used across MonsterTable, HeirloomTable, TrinketTable, and SpellTable
 * components to ensure consistent data ordering and filtering behavior.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure data constants
 * 
 * @example
 * ```typescript
 * import { RARITY_SORT_ORDER } from '@/lib/enums/tableConstants';
 * import { compareByOrder } from '@/lib/utils/tableUtils';
 * 
 * // Sort items by rarity
 * items.sort((a, b) => compareByOrder(a.rarity, b.rarity, RARITY_SORT_ORDER));
 * ```
 */

/**
 * Item rarity sorting order (from lowest to highest quality).
 * Used for sorting heirloom tables by rarity.
 * 
 * @type {Readonly<Record<string, number>>}
 */
export const RARITY_SORT_ORDER: Readonly<Record<string, number>> = {
  'nonmagical': 0,
  'common': 1,
  'uncommon': 2,
  'rare': 3,
  'very rare': 4,
  'legendary': 5,
  'artifact': 6,
  'mythic artifact': 7,
  'mythic': 8,
  'unique': 9,
} as const;

/**
 * Creature size sorting order (from smallest to largest).
 * Used for sorting monster tables by size.
 * 
 * @type {Readonly<Record<string, number>>}
 */
export const SIZE_SORT_ORDER: Readonly<Record<string, number>> = {
  'tiny': 0,
  'small': 1,
  'medium': 2,
  'large': 3,
  'huge': 4,
  'gargantuan': 5,
  'colossal': 6,
  'titanic': 7,
} as const;

/**
 * Default labels for spell level tabs (Cantrip through 12th level).
 * Note: These are fallback values - actual display uses localized strings from translations.
 * 
 * @type {Readonly<Record<number, string>>}
 */
export const DEFAULT_SPELL_LEVEL_LABELS: Readonly<Record<number, string>> = {
  0: "Cantrip",
  1: "1st Level",
  2: "2nd Level",
  3: "3rd Level",
  4: "4th Level",
  5: "5th Level",
  6: "6th Level",
  7: "7th Level",
  8: "8th Level",
  9: "9th Level",
  10: "10th Level",
  11: "11th Level",
  12: "12th Level",
} as const;
