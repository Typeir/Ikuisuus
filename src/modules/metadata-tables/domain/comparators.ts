/**
 * @fileoverview Generic comparison functions for sortable table columns.
 * @description Order-based comparison via lookup map, Lethality parsing
 * with fraction support, and Lethality comparison with missing-value handling.
 * 
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires @/modules/metadata-tables/domain/constants
 * 
 * @example
 * ```typescript
 * import { compareByOrder, parseLethality } from '@/modules/metadata-tables/domain/comparators';
 * import { SIZE_SORT_ORDER } from '@/modules/metadata-tables/domain/constants';
 * 
 * // Use in table column configuration
 * const columns = [{
 *   key: 'size',
 *   compareValues: (a, b) => compareByOrder(a, b, SIZE_SORT_ORDER)
 * }];
 * 
 * // Parse fractional Lethality values
 * const cr = parseLethality('1/2'); // Returns 0.5
 * ```
 * @module modules/metadata-tables/domain/comparators
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
 * Parses Lethality values including fractions.
 * 
 * @param {unknown} cr - Lethality string or number (e.g., "1/2", "5", 0.25)
 * @returns {number} Numeric Lethality value
 */
export function parseLethality(cr: unknown): number {
  if (typeof cr === 'number') return cr;
  const str = String(cr).trim();
  
  if (str.includes('/')) {
    const [numerator, denominator] = str.split('/').map(s => parseFloat(s.trim()));
    return numerator / denominator;
  }
  
  return parseFloat(str) || 0;
}

/**
 * Comparison utility for Lethality values.
 *
 * @param {unknown} a - First Lethality value
 * @param {unknown} b - Second Lethality value
 * @returns {number} Comparison result (-1, 0, 1)
 */
export function compareLethality(a: unknown, b: unknown): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  
  const numA = parseLethality(a);
  const numB = parseLethality(b);
  return numA - numB;
}
