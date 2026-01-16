/**
 * @fileoverview Table Utilities - Generic comparison functions for sortable table columns
 * @description Provides reusable comparison utilities for sorting metadata in tables.
 * Includes generic order-based comparison, Challenge Rating parsing with fraction support,
 * and specialized comparators for D&D 5e game data like rarity and creature size.
 * 
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires @/lib/enums/tableConstants
 * 
 * @example
 * ```typescript
 * import { compareByOrder, parseChallengeRating } from '@/lib/utils/tableUtils';
 * import { SIZE_SORT_ORDER } from '@/lib/enums/tableConstants';
 * 
 * // Use in table column configuration
 * const columns = [{
 *   key: 'size',
 *   compareValues: (a, b) => compareByOrder(a, b, SIZE_SORT_ORDER)
 * }];
 * 
 * // Parse fractional CR values
 * const cr = parseChallengeRating('1/2'); // Returns 0.5
 * ```
 */

/**
 * Generic comparison utility for ordered values based on a lookup map.
 * 
 * @param {unknown} a - First value to compare
 * @param {unknown} b - Second value to compare
 * @param {Record<string, number>} orderMap - Record mapping string keys to numeric sort order
 * @returns {number} Comparison result (-1, 0, 1) for array sorting
 */
export function compareByOrder(
  a: unknown,
  b: unknown,
  orderMap: Record<string, number>
): number {
  const orderA = orderMap[String(a || '').toLowerCase()] ?? -1;
  const orderB = orderMap[String(b || '').toLowerCase()] ?? -1;
  return orderA - orderB;
}

/**
 * Parses Challenge Rating values including fractions.
 * 
 * @param {unknown} cr - Challenge rating string or number (e.g., "1/2", "5", 0.25)
 * @returns {number} Numeric CR value
 */
export function parseChallengeRating(cr: unknown): number {
  if (typeof cr === 'number') return cr;
  const str = String(cr).trim();
  
  // Handle fractions like "1/2", "1/4", "1/8"
  if (str.includes('/')) {
    const [numerator, denominator] = str.split('/').map(s => parseFloat(s.trim()));
    return numerator / denominator;
  }
  
  // Handle regular numbers
  return parseFloat(str) || 0;
}

/**
 * Comparison utility for Challenge Rating values.
 * Handles fractions, regular numbers, and missing values.
 * 
 * @param {unknown} a - First CR value
 * @param {unknown} b - Second CR value
 * @returns {number} Comparison result (-1, 0, 1)
 */
export function compareChallengeRating(a: unknown, b: unknown): number {
  // Handle missing/undefined CRs - sort to end
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  
  const numA = parseChallengeRating(a);
  const numB = parseChallengeRating(b);
  return numA - numB;
}
