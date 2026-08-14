/**
 * @fileoverview Content Hash Utility (FNV-1a 32-bit)
 * @description Computes FNV-1a 32-bit hashes of metadata records over
 * stable (key-sorted) JSON. Output is 8 lowercase hex chars,
 * deterministic across platforms. The seed script and sync service
 * compare it against the stored hash to skip unchanged rows.
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
 * Serializes an object to JSON with keys sorted recursively.
 * Object property insertion order does not affect the output.
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
