/**
 * @fileoverview Anchor Slug
 * @description The one slug rule for in-page identity. Heading `data-anchor`
 * (hash navigation), sectionize's `section`/`article` `data-anchor`, and the
 * metadata extractor's per-feature `anchor` all derive from this function, so
 * the aspect join and deep links agree by construction.
 *
 * @module modules/library/domain/anchorSlug
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Characters an anchor keeps. Mirrors `toKebabCase`, which filenames and route
 * slugs already use, so `väkis` identifies the same way whether it arrives as a
 * filename or as a heading. Covers Latin-1 Supplement, Latin Extended-A and -B,
 * and Latin Extended Additional.
 *
 * @constant
 */
const DISALLOWED = /[^0-9a-zÀ-ɏḀ-ỿ-]/g;

/**
 * Converts text to a lowercase, hyphen-separated slug.
 *
 * Accented letters are kept rather than stripped. Dropping them collapses
 * distinct headings onto one anchor and mangles the rest: `Päimär` would slug
 * to `pimr`, and `Silmä` to `silm`.
 *
 * @param {string} text - Source text
 * @returns {string} Slug (lowercase, hyphen-separated, Latin letters preserved)
 *
 * @example
 * anchorSlug('My Awesome Heading!'); // 'my-awesome-heading'
 * anchorSlug('  Multiple   Spaces  '); // 'multiple-spaces'
 * anchorSlug('Spear of Päimär'); // 'spear-of-päimär'
 */
export function anchorSlug(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(DISALLOWED, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
