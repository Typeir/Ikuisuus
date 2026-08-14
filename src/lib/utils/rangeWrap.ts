/**
 * @fileoverview Cyclic value-wrapping utility for bounded numeric ranges.
 * @description Wraps values exceeding bounds back to the opposite end of the range.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None
 * 
 * @example
 * ```typescript
 * import { circularClamp } from '@/lib/utils/circularClamp';
 * 
 * circularClamp(5, 0, 3); // Returns 0 (wraps to min)
 * circularClamp(-1, 0, 3); // Returns 3 (wraps to max)
 * circularClamp(2, 0, 3); // Returns 2 (within range)
 * ```
 * @module src/lib/utils/rangeWrap
 */

/**
 * Wraps a number into an inclusive [min, max] range using modulo arithmetic.
 *
 * - Values above max wrap to the start of the range.
 * - Values below min wrap to the end of the range.
 * - Multiple wraps accumulate (e.g., 100 in [0, 10] wraps 9 times).
 *
 * Handles any input magnitude.
 *
 * @param {number} val - The value to wrap within the range.
 * @param {number} min - The minimum bound of the range (inclusive).
 * @param {number} max - The maximum bound of the range (inclusive).
 *
 * @returns {number} The wrapped value within [min, max].
 */
export const rangeWrap = (
  val: number,
  min: number,
  max: number
): number => {
  const range = max - min + 1;
  
  const normalized = val - min;
  const wrapped = ((normalized % range) + range) % range;
  return wrapped + min;
};
