/**
 * Table Cell Formatting
 *
 * @fileoverview Display formatting shared by the metadata table column
 * definitions.
 *
 * @module modules/metadata-tables/domain/format
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Capitalizes the first character and lowercases the rest.
 *
 * @param {string} value - Raw cell value
 * @returns {string} Display-cased value, e.g. `RARE` → `Rare`
 */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
