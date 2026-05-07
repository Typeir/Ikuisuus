/**
 * @fileoverview MDX formatting helpers for spell entries.
 * Converts structured SpellEntry fields into canonical Damocles MDX strings.
 *
 * @module scripts/migration/spellSwarm/formatters
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { SpellEntry } from './types';

/** Maps numeric spell levels to their ordinal suffixes. */
const ORDINALS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th',
  9: '9th',
};

/**
 * Formats the component string (e.g. "V, S" or "V, S, M") from boolean flags.
 *
 * @param {SpellEntry} entry - The spell entry.
 * @returns {string} Comma-separated component abbreviations.
 */
export const formatComponents = (entry: SpellEntry): string =>
  [entry.verbal && 'V', entry.somatic && 'S', entry.material && 'M']
    .filter(Boolean)
    .join(', ');

/**
 * Formats the italic level/school header for the blockquote stat block.
 * Cantrips render as "_School cantrip_"; leveled spells as "_Nth-level School_".
 *
 * @param {SpellEntry} entry - The spell entry.
 * @returns {string} Italic markdown header string.
 */
export const formatLevelSchool = (entry: SpellEntry): string => {
  if (entry.level === 0) return `_${entry.school} cantrip_`;
  return `_${ORDINALS[entry.level] ?? `${entry.level}th`}-level ${entry.school}_`;
};

/**
 * Formats the duration, prepending "Concentration, up to" where needed.
 *
 * @param {SpellEntry} entry - The spell entry.
 * @returns {string} Duration string for the stat block.
 */
export const formatDuration = (entry: SpellEntry): string =>
  entry.concentration &&
  !entry.duration.toLowerCase().startsWith('concentration')
    ? `Concentration, up to ${entry.duration}`
    : entry.duration;

/**
 * Renders the "#### Spell Lists" MDX section from the entry's spellLists array.
 * Links are rendered verbatim using the `name` and `link` fields from JSON.
 *
 * @param {SpellEntry} entry - The spell entry.
 * @returns {string} Formatted section string, or empty string if no lists.
 */
export const formatSpellLists = (entry: SpellEntry): string => {
  if (!entry.spellLists?.length) return '';
  const items = entry.spellLists
    .map((sl) => `- [_${sl.name} Spell List_](${sl.link})`)
    .join('\n');
  return `\n#### Spell Lists\n\nThis spell appears on the following spell lists:\n\n${items}\n`;
};
