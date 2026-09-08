/**
 * @fileoverview The lists a spell appears on, resolved from their slugs.
 * @description A spell names each list once — `wizard`, or
 * `berserker/want-of-knowledge` for a specialization's own list — and the link
 * and the display name are derived from that.
 *
 * @module modules/library/domain/spellLists
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

/**
 * One resolved list reference.
 *
 * @property {string} slug - The slug as the page wrote it
 * @property {string} name - Display name of the vocation or specialization
 * @property {string} link - Path to that list
 */
export interface SpellListEntry {
  slug: string;
  name: string;
  link: string;
}

/**
 * Words a title keeps in lower case unless they open it.
 */
const MINOR_WORDS = new Set(['of', 'the', 'and', 'in', 'on', 'to', 'a']);

/**
 * A slug as a title.
 *
 * @param {string} slug - Hyphenated slug
 * @returns {string} Display name
 */
function titleOf(slug: string): string {
  return slug
    .split('-')
    .filter((word) => word !== '')
    .map((word, index) =>
      index > 0 && MINOR_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/**
 * Resolve declared list slugs to their names and links.
 *
 * @description A bare slug is a vocation, whose list lives at `spells` under
 * it.
 *
 * @param {string[]} slugs - Declared slugs, in the order the page wrote them
 * @param {string} locale - Active locale, for the link
 * @returns {SpellListEntry[]} Resolved entries, blanks dropped
 */
export function spellListEntries(
  slugs: string[],
  locale: string,
): SpellListEntry[] {
  return slugs
    .map((raw) => raw.trim())
    .filter((slug) => slug !== '')
    .map((slug) => {
      const [vocation, specialization] = slug.split('/');
      const leaf = specialization ?? 'spells';
      return {
        slug,
        name: titleOf(specialization ?? vocation),
        link: `/${locale}/library/character-creation/vocations/${vocation}/${leaf}`,
      };
    });
}
