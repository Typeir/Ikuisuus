/**
 * @fileoverview Circular Clamp Utility - Cyclic value wrapping for bounded ranges
 * @description Wraps numeric values that exceed bounds back to the opposite end of the range.
 * Unlike standard clamping which locks at min/max, this creates cyclic behavior useful
 * for rotations, index navigation, and theme cycling. Used by ThemeSelector for
 * circular theme switching.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure math utility
 * 
 * @example
 * ```typescript
 * import { circularClamp } from '@/lib/utils/circularClamp';
 * 
 * circularClamp(5, 0, 3); // Returns 0 (wraps to min)
 * circularClamp(-1, 0, 3); // Returns 3 (wraps to max)
 * circularClamp(2, 0, 3); // Returns 2 (within range)
 * ```
 */

/**
 * Wraps a number around an inclusive range indefinitely using modulo arithmetic.
 *
 * - Values exceeding max wrap around to the beginning of the range.
 * - Values below min wrap around to the end of the range.
 * - Handles multiple wraps correctly (e.g., 100 in range [0, 10] wraps 9 times).
 *
 * Uses proper modulo math to handle any value, no matter how far outside the range.
 * For example, with range [0, 2]: rangeWrap(7, 0, 2) → 1 (wraps twice, remainder 1)
 *
 * Useful for cyclic ranges (e.g., angle wrapping, index rotation, theme cycling).
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
