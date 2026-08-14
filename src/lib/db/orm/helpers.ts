/**
 * @fileoverview Row Mapping Utilities
 * @description Helpers mapping DB entity rows to domain objects. Normalise
 * `null` DB column values to `undefined`.
 *
 * @module lib/db/orm/helpers
 * @version 1.0.0
 * @author Typeir
 * @since 5.0.0
 */

/**
 * Converts a nullable database value to `undefined` for domain objects.
 *
 * @param {T | null | undefined} val - Database field value
 * @returns {T | undefined} The value or undefined
 */
export const orUndef = <T>(val: T | null | undefined): T | undefined =>
  val ?? undefined;

/**
 * Returns the array when it has entries, otherwise `undefined`.
 * Converts empty arrays to `undefined` for optional domain fields.
 *
 * @param {T[]} arr - Array column value
 * @returns {T[] | undefined} Non-empty array or undefined
 */
export const nonEmpty = <T>(arr: T[]): T[] | undefined =>
  arr.length > 0 ? arr : undefined;

/**
 * Formats a `Date | null` to an ISO-8601 string, or `undefined` if absent.
 *
 * @param {Date | null | undefined} date - Date field
 * @returns {string | undefined} ISO-8601 string or undefined
 */
export const formatDate = (
  date: Date | null | undefined,
): string | undefined => {
  if (date == null) return undefined;
  return date instanceof Date ? date.toISOString() : String(date);
};
