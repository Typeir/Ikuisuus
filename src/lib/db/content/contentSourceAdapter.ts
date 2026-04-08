/**
 * @fileoverview Content Source Adapter Interface
 * @description Defines the hexagonal port contract for fetching raw MDX/MD content.
 * Implementations target the local filesystem (build-time) or a remote Git host
 * (runtime ISR) without changing consumer code.
 *
 * @module lib/db/content/contentSourceAdapter
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Result returned by a content source adapter on a successful fetch.
 *
 * @property {string} content - Raw file content (MDX/MD source)
 * @property {string} resolvedPath - The path that resolved (filesystem absolute or virtual)
 */
export interface ContentFetchResult {
  /** Raw file content (MDX/MD source) */
  content: string;
  /** The path that resolved (filesystem absolute or virtual) */
  resolvedPath: string;
}

/**
 * Adapter interface for raw content fetching.
 * Implementations MUST return null when the content cannot be found rather than throwing.
 */
export interface ContentSourceAdapter {
  /**
   * Fetches raw content for a given locale and slug path.
   *
   * @param {string} locale - Locale code (e.g. "en", "es")
   * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
   * @returns {Promise<ContentFetchResult | null>} Content and resolved path, or null if not found
   */
  fetch(locale: string, slugPath: string): Promise<ContentFetchResult | null>;
}
