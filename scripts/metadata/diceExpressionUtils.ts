/**
 * Dice Expression Metadata Utilities
 *
 * @fileoverview Strips `[% ... %]` wrapping from dice expressions in raw MDX
 * content and extracts dice notation.
 *
 * @module scripts/metadata/diceExpressionUtils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { DICE } from './parsingPatterns';

/**
 * Strips `[% ... %]` delimiters from dice expressions in text,
 * leaving only the inner dice notation and modifiers.
 *
 * @param {string} text - Raw text that may contain wrapped dice expressions
 * @returns {string} Text with `[%` and `%]` delimiters removed
 *
 * @example
 * stripDiceWrappers('[% 3d6 + 5 fire %] damage') // '3d6 + 5 fire damage'
 * stripDiceWrappers('2d20 attack')               // '2d20 attack' (no change)
 */
export function stripDiceWrappers(text: string): string {
  if (!text) return text;
  return text.replace(DICE.wrapped, (_full, inner) => inner.trim());
}

/**
 * Extracts the first dice notation (e.g. "2d6") from text that may be
 * wrapped in `[% ... %]` delimiters.
 *
 * @param {string} text - Raw text potentially containing wrapped dice
 * @returns {string | null} The dice notation string or null if none found
 *
 * @example
 * extractDiceFromExpression('[% 3d6 + 5 fire %]') // '3d6'
 * extractDiceFromExpression('2d20')                // '2d20'
 * extractDiceFromExpression('no dice here')        // null
 */
export function extractDiceFromExpression(text: string): string | null {
  if (!text) return null;
  const unwrapped = stripDiceWrappers(text);
  const match = unwrapped.match(DICE.innerDice);
  return match ? match[1] : null;
}
