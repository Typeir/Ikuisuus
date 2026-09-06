/**
 * @fileoverview Anchor Slug
 * @description The one slug rule for in-page identity.
 *
 * @module modules/library/domain/anchorSlug
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Characters an anchor keeps.
 *
 * @constant
 */
const DISALLOWED = /[^0-9a-zÀ-ɏḀ-ỿ-]/g;

/**
 * Converts text to a lowercase, hyphen-separated slug.
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
