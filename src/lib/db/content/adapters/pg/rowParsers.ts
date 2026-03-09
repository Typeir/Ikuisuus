/**
 * @fileoverview Shared Prisma Row Parsing Utilities
 * @description Reusable helper functions for mapping Prisma rows to domain
 * objects. Prisma returns `null` for absent nullable columns and empty arrays
 * for unpopulated list columns — these helpers normalise those values to the
 * `undefined` semantics used by our domain schemas.
 *
 * @module lib/db/content/adapters/pg/rowParsers
 * @version 4.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Converts a Prisma `null` to `undefined` for domain objects.
 * Prisma returns `null` for absent nullable columns; our domain types
 * use `undefined` to express optionality.
 *
 * @param {T | null} val - Prisma field value
 * @returns {T | undefined} The value or undefined
 */
export const orUndef = <T>(val: T | null): T | undefined => val ?? undefined;

/**
 * Returns the array when it has entries, otherwise `undefined`.
 * Prisma always returns an array (never null) for `String[]` / `Int[]`
 * columns — this converts empty arrays to `undefined` for optional
 * domain fields.
 *
 * @param {T[]} arr - Prisma array column value
 * @returns {T[] | undefined} Non-empty array or undefined
 */
export const nonEmpty = <T>(arr: T[]): T[] | undefined =>
  arr.length > 0 ? arr : undefined;

/**
 * Formats a Prisma `Date | null` to an ISO-8601 string, or `undefined`
 * if absent. Handles both `Date` objects and unexpected string
 * representations from edge-case driver behaviour.
 *
 * @param {Date | null} date - Prisma date field
 * @returns {string | undefined} ISO-8601 string or undefined
 */
export const formatDate = (date: Date | null): string | undefined => {
  if (date == null) return undefined;
  return date instanceof Date ? date.toISOString() : String(date);
};
