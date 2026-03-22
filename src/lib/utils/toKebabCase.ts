/**
 * @fileoverview Kebab Case Converter - String formatting utility for URL slugs
 * @description Converts camelCase, PascalCase, snake_case, and space-separated strings
 * to kebab-case format. Used throughout the codebase for URL generation, filename
 * normalization, and CSS class naming. Handles multiple formatting conventions.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure string utility
 * 
 * @example
 * ```typescript
 * import { toKebabCase } from '@/lib/utils/toKebabCase';
 * 
 * toKebabCase('MyExampleString'); // 'my-example-string'
 * toKebabCase('my_example_string'); // 'my-example-string'
 * toKebabCase('My Example String'); // 'my-example-string'
 * ```
 */

/**
 * Converts a string to kebab-case.
 *
 * Handles:
 * - camelCase → kebab-case
 * - PascalCase → kebab-case
 * - snake_case → kebab-case
 * - Space-separated → kebab-case
 * - Special characters (removed)
 * - Multiple spaces (collapsed)
 * - Leading/trailing whitespace (trimmed)
 * - Number-letter transitions (Level5Monster → level5-monster)
 * - Decimal points (Version 2.0 → version-20)
 *
 * Example:
 *   "My Example String" -> "my-example-string"
 *   "Albedo, the Bleak Bloom" -> "albedo-the-bleak-bloom"
 *
 * @param {string} str - The input string to convert.
 * @returns {string} The kebab-case formatted string.
 */
const COMBINING_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/**
 * Converts selected non-decomposing Latin letters to ASCII equivalents.
 *
 * @param {string} value - Input string
 * @returns {string} ASCII-transliterated string
 */
function transliterateSpecialLatin(value: string): string {
  return value
    .replace(/ß/g, 'ss')
    .replace(/Æ/g, 'AE')
    .replace(/æ/g, 'ae')
    .replace(/Œ/g, 'OE')
    .replace(/œ/g, 'oe')
    .replace(/Ø/g, 'O')
    .replace(/ø/g, 'o')
    .replace(/Þ/g, 'TH')
    .replace(/þ/g, 'th')
    .replace(/Ð/g, 'D')
    .replace(/ð/g, 'd')
    .replace(/Ł/g, 'L')
    .replace(/ł/g, 'l');
}

/**
 * Normalizes and transliterates Unicode text into an ASCII-compatible string.
 *
 * @param {string} value - Input string
 * @returns {string} Normalized ASCII-compatible string
 */
function normalizeForSlug(value: string): string {
  return transliterateSpecialLatin(value)
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS_REGEX, '');
}

/**
 * Converts a string to kebab-case.
 *
 * @param {string} str - The input string to convert.
 * @returns {string} The kebab-case formatted string.
 */
export const toKebabCase = (str: string): string =>
  normalizeForSlug(str)
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase();
