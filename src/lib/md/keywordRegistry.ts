/**
 * Keyword Registry
 *
 * @fileoverview Canonical registry of rules keywords rendered by the
 * `<Keyword>` MDX component. Each entry carries the hover definition and the
 * rule page the keyword links to. Lookup is case-insensitive and collapses
 * inner whitespace, so display casing in content stays free.
 *
 * @module lib/md/keywordRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 */

/**
 * A single keyword definition.
 *
 * @interface KeywordEntry
 * @property {string} term - Canonical lowercase term, e.g. "damage bonus"
 * @property {string} href - Locale-relative rule page path the keyword links to
 * @property {string} blurb - Hover definition shown in the tooltip
 */
export interface KeywordEntry {
  term: string;
  href: string;
  blurb: string;
}

/**
 * All registered keywords, keyed by canonical term.
 *
 * @constant
 */
export const KEYWORD_REGISTRY: Record<string, KeywordEntry> = {
  accuracy: {
    term: 'accuracy',
    href: 'library/rules/steel-and-strife/making-an-attack',
    blurb:
      'The tier bonus plus the feature’s keyed ability. An attack rolls d20 plus accuracy; a saving throw imposed by the feature is made against 10 plus accuracy.',
  },
  'damage bonus': {
    term: 'damage bonus',
    href: 'library/rules/steel-and-strife/making-an-attack',
    blurb: 'The feature’s keyed ability alone, without the tier bonus.',
  },
  briefly: {
    term: 'briefly',
    href: 'library/rules/steel-and-strife/effects-and-enhancements',
    blurb:
      'The default duration. The effect ends at the end of the sufferer’s turn, when it is resisted or ended externally, or when its source dies or loses concentration.',
  },
};

/**
 * Normalizes a raw keyword to its canonical lookup form.
 *
 * @param {string} raw - Author-written keyword text, any casing
 * @returns {string} Lowercased text with inner whitespace collapsed
 */
export function normalizeKeyword(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Resolves a keyword to its registry entry.
 *
 * @param {string} raw - Author-written keyword text, any casing
 * @returns {KeywordEntry | null} The entry, or null for unregistered keywords
 */
export function lookupKeyword(raw: string): KeywordEntry | null {
  return KEYWORD_REGISTRY[normalizeKeyword(raw)] ?? null;
}
