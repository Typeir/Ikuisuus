/**
 * @fileoverview Title Case Converter - Kebab-case to human-readable title formatter
 * @description Converts kebab-case strings to Title Case with normalized spacing.
 * Inverse operation of toKebabCase. Collapses multiple consecutive dashes into single
 * spaces and capitalizes the first letter of each word. Used for displaying slugs
 * as page titles and breadcrumb labels.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure string utility
 * 
 * @example
 * ```typescript
 * import { toTitleCase } from '@/lib/utils/toTitleCase';
 * 
 * toTitleCase('iron-snail-warrior'); // 'Iron Snail Warrior'
 * toTitleCase('items---heirlooms'); // 'Items Heirlooms'
 * ```
 */

/**
 * Converts a dash-separated string (e.g., kebab-case) to Title Case.
 * Collapses multiple dashes into a single space.
 *
 * Example:
 * - "iron-snail---warrior" → "Iron Snail Warrior"
 *
 * @param {string} str - The input string using dashes as separators.
 * @returns {string} The converted string in Title Case with normalized spacing.
 */
export const toTitleCase = (str: string) =>
  str.replace(/-+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
