/**
 * @fileoverview Dice Rolling Utilities
 * @description Shared primitive for all dice rolls across the application.
 * Used by both the character sheet HP roller and the encounter planner combat
 * mechanics (heroic affix rolling, fate dice).
 *
 * @module lib/utils/diceUtils
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

/**
 * Rolls a single die with the given number of faces.
 * Returns 1 for invalid face counts (non-finite or less than 1).
 *
 * @function rollDie
 * @param {number} faces - Number of faces on the die (e.g. 6, 8, 10, 12, 20)
 * @returns {number} Random integer in the inclusive range [1, faces]
 * @example
 * rollDie(20); // 1–20
 * rollDie(6);  // 1–6
 */
export function rollDie(faces: number): number {
  if (!Number.isFinite(faces) || faces < 1) return 1;
  return Math.floor(Math.random() * faces) + 1;
}
