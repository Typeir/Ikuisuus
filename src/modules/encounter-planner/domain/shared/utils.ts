/**
 * @fileoverview Pure utility functions shared across the encounter-planner module.
 * Depends on the shared dice-rolling primitive.
 *
 * @module modules/encounter-planner/domain/shared/utils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { rollDie } from '@/lib/utils/diceUtils';

/**
 * Generate a unique ID for encounters or creatures.
 *
 * @function generateId
 * @returns {string} Unique identifier in format "timestamp-randomString"
 *
 * @example
 * const id = generateId(); // "1734451200000-a3b5c7d9e"
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate d20 initiative modifier from dexterity ability score.
 *
 * @function calculateInitiativeMod
 * @param {number} dex - Dexterity ability score (typically 1-30)
 * @returns {number} Initiative modifier (typically -5 to +10)
 *
 * @example
 * calculateInitiativeMod(10); // 0
 * calculateInitiativeMod(16); // +3
 * calculateInitiativeMod(8);  // -1
 */
export const calculateInitiativeMod = (dex: number): number => {
  return Math.floor((dex - 10) / 2);
};

/**
 * Roll 1d20 and add initiative modifier for creature initiative.
 *
 * @function rollInitiative
 * @param {number} initiativeMod - Initiative modifier to add to roll
 * @returns {number} Total initiative (1d20 + modifier)
 *
 * @example
 * const init = rollInitiative(3); // Rolls 1d20+3
 * // Possible results: 4-23
 */
export const rollInitiative = (initiativeMod: number): number => {
  const d20 = rollDie(20);
  return d20 + initiativeMod;
};

/**
 * Slugify an affix name for use in URLs or keys.
 *
 * @function affixSlug
 * @param {string} name - Affix display name
 * @returns {string} Lowercase hyphen-separated slug
 */
export function affixSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}
