/**
 * @fileoverview Content Hash Utility (FNV-1a 32-bit)
 * @description Produces small, deterministic, high-variance hashes for
 * metadata records. Used by the seed script to detect changes: if the hash
 * in the database matches the hash of the incoming record, the row is skipped.
 *
 * FNV-1a properties:
 *   - 32-bit → 8 hex characters (compact, fits in a text column easily)
 *   - Zero dependencies (pure math, no crypto import)
 *   - Excellent avalanche — a single character change flips ~half the bits
 *   - Deterministic across platforms (same input → same hash)
 *
 * The hash is computed over `JSON.stringify(record)` with keys sorted so
 * insertion order doesn't affect the result.
 *
 * @module scripts/core/contentHash
 */

/**
 * FNV-1a 32-bit offset basis and prime.
 *
 * @type {number}
 */
const FNV_OFFSET = 0x811c9dc5;

/**
 * FNV-1a 32-bit prime.
 *
 * @type {number}
 */
const FNV_PRIME = 0x01000193;

/**
 * Computes the FNV-1a 32-bit hash of a UTF-8 string.
 *
 * @param {string} str - Input string to hash
 * @returns {string} 8-character lowercase hexadecimal hash
 */
export function fnv1a32(str) {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Produces a deterministic JSON string with sorted keys so that
 * semantically identical objects always produce the same hash
 * regardless of property insertion order.
 *
 * @param {unknown} obj - Object to serialize
 * @returns {string} Deterministic JSON string
 */
function stableStringify(obj) {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
    }
    return value;
  });
}

/**
 * Computes a version hash for a metadata record.
 *
 * @param {Record<string, unknown>} record - A single metadata record (monster, heirloom, spell, trinket)
 * @returns {string} 8-character hex hash
 *
 * @example
 * ```js
 * const hash = contentHash({ slug: 'acid-splash', title: 'Acid Splash', level: 0 });
 * // → "a3f2b1c0"
 * ```
 */
export function contentHash(record) {
  return fnv1a32(stableStringify(record));
}
