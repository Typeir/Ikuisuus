/**
 * @fileoverview Centralised cache tag naming for content sources and revalidation.
 *
 * @module lib/db/content/contentCacheTags
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * @function contentCacheTag
 * @description Builds a Next.js fetch cache tag from a locale and slug.
 *
 * @param {string} locale - Locale code (e.g. "en")
 * @param {string} slugPath - Content slug without locale or /library/ prefix
 * @returns {string} Cache tag string (e.g. "content-en-monsters/albedo")
 */
export const contentCacheTag = (locale: string, slugPath: string): string =>
  `content-${locale}-${slugPath}`;
