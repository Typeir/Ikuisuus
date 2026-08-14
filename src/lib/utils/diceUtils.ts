/**
 * @fileoverview Dice Rolling Utilities
 * @description Shared primitives for dice rolls: rolling, parsing face counts
 * from die notation, formatting, and max/min result checks.
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

/**
 * Face count meaning "this vocation has no usable hit die".
 *
 * @constant UNKNOWN_DIE
 * @type {number}
 */
export const UNKNOWN_DIE = 0;

/**
 * Reads the face count out of authored die notation (`"d12"`, `"12"`, `"D12"`,
 * `"d12 per Berserker level"`).
 *
 * @function parseDieFaces
 * @param {string} notation - Authored die notation
 * @returns {number} Face count, or {@link UNKNOWN_DIE} when none is present
 * @example
 * parseDieFaces('d12 per Berserker level'); // 12
 * parseDieFaces('nonsense');                // 0
 */
export function parseDieFaces(notation: string): number {
  const match = /d?(\d+)/i.exec(notation.trim());
  if (!match) return UNKNOWN_DIE;
  const faces = Number.parseInt(match[1], 10);
  return Number.isFinite(faces) && faces > 0 ? faces : UNKNOWN_DIE;
}

/**
 * Renders a face count as display notation.
 *
 * @function formatDie
 * @param {number} faces - Face count
 * @param {number} [count] - Optional die count for `NdX` form
 * @returns {string} `"d12"`, `"5d12"`, or `"d?"` when the die is unknown
 * @example
 * formatDie(12);    // 'd12'
 * formatDie(12, 5); // '5d12'
 */
export function formatDie(faces: number, count?: number): string {
  const die = faces > 0 ? `d${faces}` : 'd?';
  return count === undefined ? die : `${count}${die}`;
}

/**
 * Determines if a die result is the maximum possible (critical).
 *
 * @function isMaxRoll
 * @param {number} value - The die result
 * @param {number} faces - The die's face count
 * @returns {boolean} True if the die rolled its maximum value
 */
export function isMaxRoll(value: number, faces: number): boolean {
  return value === faces;
}

/**
 * Determines if a die result is the minimum possible (natural 1).
 *
 * @function isMinRoll
 * @param {number} value - The die result
 * @returns {boolean} True if the die rolled a 1
 */
export function isMinRoll(value: number): boolean {
  return value === 1;
}
