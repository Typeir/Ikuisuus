/**
 * @fileoverview Converts camelCase, PascalCase, snake_case, and space-separated strings
 * to kebab-case.
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
 * @module src/lib/utils/toKebabCase
 */

/**
 * Converts a string to kebab-case. Splits on camelCase/PascalCase boundaries,
 * removes special characters and decimal points, collapses whitespace and
 * underscores to single hyphens, trims leading/trailing hyphens, lowercases.
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
