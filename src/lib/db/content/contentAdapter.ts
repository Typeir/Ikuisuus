/**
 * @fileoverview Content Metadata Adapter Interface
 * @description Defines the pluggable adapter contract for reading content metadata
 * (monsters, heirlooms, spells, trinkets). Implementations can target the local
 * filesystem (`.metadata.json` sidecar files) or a database without changing
 * consumer code.
 *
 * The adapter is intentionally thin — it provides raw JSON records.
 * Filtering (e.g. by slug) is handled by the service layer or the API route.
 *
 * @module lib/db/content/contentAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* ──────────────────────  Content Categories  ──────────────────────── */

/**
 * Supported content categories that map to subdirectories or database tables.
 *
 * @property {'monsters'} monsters - Monster stat blocks
 * @property {'heirlooms'} heirlooms - Magical heirloom items
 * @property {'spells'} spells - Spell definitions
 * @property {'trinkets'} trinkets - Adventuring trinket items
 */
export type ContentCategory = 'monsters' | 'heirlooms' | 'spells' | 'trinkets';

/* ─────────────────────────  Adapter Interface  ──────────────────────── */

/**
 * Adapter interface for reading content metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable (return empty arrays or null, not throw).
 */
export interface ContentAdapter {
  /**
   * Returns all metadata records for a given content category and locale.
   * Records are already flattened (multi-variant files produce multiple entries).
   *
   * @param {ContentCategory} category - Content type to query
   * @param {string} locale - Locale code (e.g. 'en', 'es', 'fi')
   * @returns {Promise<Record<string, unknown>[]>} Array of metadata objects
   */
  listMetadata: (
    category: ContentCategory,
    locale: string,
  ) => Promise<Record<string, unknown>[]>;

  /**
   * Returns metadata records for a given category filtered by slug list.
   * If `slugs` is empty or undefined, behaves like `listMetadata`.
   *
   * @param {ContentCategory} category - Content type to query
   * @param {string} locale - Locale code
   * @param {string[]} [slugs] - Optional slug filter
   * @returns {Promise<Record<string, unknown>[]>} Filtered metadata objects
   */
  listMetadataBySlugs: (
    category: ContentCategory,
    locale: string,
    slugs?: string[],
  ) => Promise<Record<string, unknown>[]>;
}
