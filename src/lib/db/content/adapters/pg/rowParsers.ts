/**
 * @fileoverview Row parsing utilities for PostgreSQL repositories.
 * @description Provides type-safe helpers to convert raw `pg` driver values
 * (which arrive as `unknown`) into typed primitives. Centralising these
 * eliminates repetitive ternary chains across every row-mapper function.
 *
 * Postgres driver quirks handled:
 *  - Booleans may arrive as `true`/`false`, `1`/`0`, or strings `'t'`/`'f'`/`'true'`/`'false'`.
 *  - Array columns (TEXT[]) arrive as JS arrays when using the `pg` driver with
 *    the default type parser; `asStringArray` also handles the raw `{a,b}` text
 *    format as a fallback.
 *
 * @module lib/db/content/adapters/pg/rowParsers
 * @version 1.0.0
 */

/**
 * Coerces a raw DB value to a `string`, or `undefined` if the value is null/undefined.
 *
 * @param {unknown} v - Raw value from a DB row
 * @returns {string | undefined}
 */
export const asString = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  return String(v);
};

/**
 * Coerces a raw DB value to a finite `number`, or `undefined` if the value is
 * null/undefined or cannot be parsed as a finite number.
 *
 * @param {unknown} v - Raw value from a DB row
 * @returns {number | undefined}
 */
export const asNumber = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Coerces a raw DB value to a `boolean`.
 * Handles native JS booleans, numeric `1`/`0`, and the Postgres text
 * representations `'t'`, `'f'`, `'true'`, `'false'`, `'1'`, `'0'`.
 * Returns `false` when the value is null/undefined.
 *
 * @param {unknown} v - Raw value from a DB row
 * @returns {boolean}
 */
export const asBoolean = (v: unknown): boolean => {
  if (v == null || v === false || v === 0) return false;
  if (v === true || v === 1) return true;
  const s = String(v).toLowerCase();
  return s === 't' || s === 'true' || s === '1';
};

/**
 * Coerces a raw DB value to a `string[]`, or `undefined` if the value is
 * null/undefined. Handles:
 *  - Native JS arrays (normal `pg` driver behaviour for `TEXT[]` columns)
 *  - Postgres text-array format `{a,b,"c d"}` (fallback)
 *  - JSON string fallback `["a","b"]`
 *
 * @param {unknown} v - Raw value from a DB row
 * @returns {string[] | undefined}
 */
export const asStringArray = (v: unknown): string[] | undefined => {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map(String);

  if (typeof v === 'string') {
    const trimmed = v.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      if (!inner) return [];
      return inner.split(',').map((s) => s.replace(/^"(.*)"$/, '$1').trim());
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // not JSON — fall through
    }

    return trimmed ? [trimmed] : [];
  }

  return undefined;
};
