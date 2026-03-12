/**
 * @fileoverview Content Cache Tag Utilities
 * @description Centralises the cache tag naming convention used by content source
 * adapters and the revalidation API. Both sides import from here so tags are
 * guaranteed to match.
 *
 * @module lib/db/content/contentCacheTags
 */

/**
 * @function contentCacheTag
 * @description Builds the Next.js fetch cache tag for a given locale and slug.
 * Used by the GitHub content source when tagging fetches and by the
 * revalidation API when invalidating them.
 *
 * @param {string} locale - Locale code (e.g. "en")
 * @param {string} slugPath - Content slug without locale or /library/ prefix
 * @returns {string} Cache tag string (e.g. "content-en-monsters/albedo")
 */
export const contentCacheTag = (locale: string, slugPath: string): string =>
  `content-${locale}-${slugPath}`;
