/**
 * @fileoverview Anchor Slug
 * @description The one slug rule for in-page identity. Heading `data-anchor`
 * (hash navigation), sectionize's `section`/`article` `data-anchor`, and the
 * metadata extractor's per-feature `anchor` all derive from this function, so
 * the aspect join and deep links agree by construction.
 *
 * @module modules/library/domain/anchorSlug
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Converts text to a lowercase, hyphen-separated URL-safe slug.
 *
 * @param {string} text - Source text
 * @returns {string} Slug (lowercase, hyphen-separated, ASCII word chars only)
 *
 * @example
 * anchorSlug('My Awesome Heading!'); // 'my-awesome-heading'
 * anchorSlug('  Multiple   Spaces  '); // 'multiple-spaces'
 */
export function anchorSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}
