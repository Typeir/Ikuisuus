/**
 * @fileoverview Deterministic Foundry VTT document ID generator.
 * @description Generates a 16-character alphanumeric ID from a content slug via
 * SHA-256. Same input always yields the same ID.
 *
 * Foundry VTT requires document IDs to be exactly 16 characters, alphanumeric only.
 *
 * @module foundry/scripts/utils/idGenerator
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-12
 */

import { createHash } from 'node:crypto';

/** Characters allowed in Foundry document IDs. */
const FOUNDRY_ID_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Required length for Foundry document IDs. */
const FOUNDRY_ID_LENGTH = 16;

/**
 * Generates a deterministic 16-character Foundry VTT document ID from a slug.
 *
 * @param {string} slug - Content slug used as seed (e.g. "albedo-the-bleak-bloom")
 * @param {string} [namespace] - Optional namespace prefix to avoid collisions across
 *   content types (e.g. "monster", "heirloom"). Combined as "namespace:slug" before hashing.
 * @returns {string} 16-character alphanumeric Foundry document ID
 *
 * @example
 * ```typescript
 * generateFoundryId('rotworm', 'monster');
 * // Always returns the same 16-char string for this input
 * ```
 */
export function generateFoundryId(slug: string, namespace?: string): string {
  const seed = namespace ? `${namespace}:${slug}` : slug;
  const hash = createHash('sha256').update(seed).digest();
  let id = '';

  for (let i = 0; i < FOUNDRY_ID_LENGTH; i++) {
    id += FOUNDRY_ID_CHARS[hash[i] % FOUNDRY_ID_CHARS.length];
  }

  return id;
}
