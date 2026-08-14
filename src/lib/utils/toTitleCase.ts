/**
 * @fileoverview Title case conversion utility.
 * @description Converts kebab-case strings to Title Case. Inverse of toKebabCase.
 * Collapses consecutive dashes into single spaces and capitalizes each word.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires None
 *
 * @example
 * ```typescript
 * import { toTitleCase } from '@/lib/utils/toTitleCase';
 *
 * toTitleCase('iron-snail-warrior'); // 'Iron Snail Warrior'
 * toTitleCase('items---heirlooms'); // 'Items Heirlooms'
 * ```
 * @module src/lib/utils/toTitleCase
 */

/**
 * Lowercases a word and uppercases its first character.
 *
 * @param {string} str - The word to capitalize.
 * @returns {string} The word with one uppercase leading character.
 */
function capitalizeWord(word: string): string {
  const normalized = word.toLocaleLowerCase();
  const [first, ...rest] = Array.from(normalized);
  if (!first) {
    return '';
  }
  return `${first.toLocaleUpperCase()}${rest.join('')}`;
}

/**
 * Converts a dash-separated string (e.g., kebab-case) to Title Case.
 * Collapses multiple dashes into a single space.
 *
 * @param {string} str - The input string using dashes as separators.
 * @returns {string} The converted string in Title Case with normalized spacing.
 */
export const toTitleCase = (str: string): string =>
  str
    .replace(/-+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
