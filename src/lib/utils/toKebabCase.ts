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
export const toKebabCase = (str: string): string =>
  str
    .normalize('NFC')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '')
    .replace(/[^0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s_-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase();
