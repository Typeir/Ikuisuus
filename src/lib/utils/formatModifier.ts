/**
 * Modifier Formatting
 *
 * @fileoverview Signed display string for an ability or roll modifier.
 *
 * @module lib/utils/formatModifier
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Formats a modifier with an explicit sign.
 *
 * @param {number} modifier - Already-computed modifier value
 * @returns {string} Signed string, e.g. `+2` or `-1`
 *
 * @example
 * formatModifier(2); // '+2'
 * formatModifier(-1); // '-1'
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}
