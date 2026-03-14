/**
 * @fileoverview Content Hash Utility (FNV-1a 32-bit)
 * @description Produces small, deterministic, high-variance hashes for
 * metadata records. Used by the seed script and sync service to detect
 * changes: if the hash in the database matches the hash of the incoming
 * record, the row is skipped.
 *
 * FNV-1a properties:
 *   - 32-bit -> 8 hex characters (compact, fits in a text column easily)
 *   - Zero dependencies (pure math, no crypto import)
 *   - Excellent avalanche — a single character change flips ~half the bits
 *   - Deterministic across platforms (same input -> same hash)
 *
 * The hash is computed over `JSON.stringify(record)` with keys sorted so
 * insertion order doesn't affect the result.
 *
 * @module lib/metadata/contentHash
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

/** @property {number} FNV_OFFSET - FNV-1a 32-bit offset basis */
const FNV_OFFSET = 0x811c9dc5;

/** @property {number} FNV_PRIME - FNV-1a 32-bit prime */
const FNV_PRIME = 0x01000193;

/**
 * Computes the FNV-1a 32-bit hash of a UTF-8 string.
 *
 * @param {string} str - Input string to hash
 * @returns {string} 8-character lowercase hexadecimal hash
 */
export function fnv1a32(str: string): string {
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
function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, (_key: string, value: unknown) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce(
          (sorted, k) => {
            sorted[k] = (value as Record<string, unknown>)[k];
            return sorted;
          },
          {} as Record<string, unknown>,
        );
    }
    return value;
  });
}

/**
 * Computes a version hash for a metadata record.
 *
 * @param {Record<string, unknown>} record - A single metadata record (monster, heirloom, spell, trinket)
 * @returns {string} 8-character hex hash
 */
export function contentHash(record: Record<string, unknown>): string {
  return fnv1a32(stableStringify(record));
}
