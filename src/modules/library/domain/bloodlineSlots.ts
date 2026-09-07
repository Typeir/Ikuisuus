/**
 * @fileoverview Bloodline slot schema.
 * @description Kept beside the main schema rather than in it, so that file
 * stays under its length limit.
 *
 * @module modules/library/domain/bloodlineSlots
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

/**
 * Header slots of a bloodline: the two Core Features rows.
 *
 * @description Every one is written as a child element, never an attribute: a
 * cell can carry a list or a `<Tooltip>`, and a quoted attribute holds neither.
 */
export const BLOODLINE_SLOTS = {
  abilityScores: 'AbilityScores',
  speeds: 'Speeds',
  senses: 'Senses',
  size: 'Size',
  creatureTypes: 'CreatureTypes',
  age: 'Age',
} as const;

/**
 * The bloodline slots of each Core Features row, in column order.
 */
export const BLOODLINE_TABLES = [
  ['abilityScores', 'speeds', 'senses'],
  ['size', 'creatureTypes', 'age'],
] as const satisfies readonly (readonly (keyof typeof BLOODLINE_SLOTS)[])[];

/**
 * Boon points a bloodline grants unless it says otherwise.
 */
export const DEFAULT_BOON_POINTS = 10;

/**
 * Bloodline slot names.
 */
export type BloodlineSlotName = keyof typeof BLOODLINE_SLOTS;

/**
 * Bloodline slot names in schema order.
 */
export const BLOODLINE_SLOT_NAMES = Object.keys(
  BLOODLINE_SLOTS,
) as BloodlineSlotName[];
