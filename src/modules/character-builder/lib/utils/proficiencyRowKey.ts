/**
 * @fileoverview Proficiency Row-Key Mapper
 * @description Maps a vocation's Title-Case skill/trade grant name (as authored
 * in the Core Traits table) to the i18n ROW KEY the skills/tools tables use
 * (`skills.<camel>` / `tools.<camel>`), so a hint marker or floor can be placed
 * on the correct row. Output is byte-identical to the keys `deriveGrantFloors`
 * emits, so both share the same `map[skill.name]` / `map[tool.name]` lookup.
 * Wildcard / category tokens ("Trade", "Skills", "one Trade of your choice")
 * resolve to `null` — they are not a single row.
 *
 * @module modules/character-builder/lib/utils/proficiencyRowKey
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { stripInlineMarkdown } from '@/lib/utils/stripInlineMarkdown';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { kebabToCamel } from './grants';

/** Category words that name a whole proficiency class rather than a single row. */
const CATEGORY_TOKENS: ReadonlySet<string> = new Set([
  'skill',
  'skills',
  'trade',
  'trades',
]);

/** Phrasing that marks an unrestricted / choose-from-anything grant. */
const WILDCARD_PHRASE = /\bof your choice\b|^\s*(?:choose|pick)\b/i;

/**
 * Extracts a tool row key from a markdown link whose href points at a specific
 * trade page (`[Thievery](/en/library/items/tools/thievery)` → `tools.thievery`).
 *
 * @function toolKeyFromHref
 * @param {string} name - Raw grant string that may contain a markdown link
 * @returns {string | null} `tools.<camel>` when a `/tools/<slug>` href is present, else `null`
 */
function toolKeyFromHref(name: string): string | null {
  const match = name.match(/\/tools\/([a-z0-9-]+)/i);
  return match ? `tools.${kebabToCamel(match[1].toLowerCase())}` : null;
}

/**
 * Resolves a skill/trade grant name to its table row key, or `null` when the
 * name is a wildcard/category rather than a specific proficiency.
 *
 * @function proficiencyRowKey
 * @param {'skill' | 'trade'} category - Which table the name belongs to
 * @param {string} name - Grant name (Title-Case, possibly a markdown link or bold-wrapped)
 * @returns {string | null} `skills.<camel>` / `tools.<camel>`, or `null` for wildcard/category tokens
 */
export function proficiencyRowKey(
  category: 'skill' | 'trade',
  name: string,
): string | null {
  if (category === 'trade') {
    const fromHref = toolKeyFromHref(name);
    if (fromHref) return fromHref;
  }
  const cleaned = stripInlineMarkdown(name)
    .replace(/\([^)]*\)/g, '')
    .trim();
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  if (CATEGORY_TOKENS.has(lower) || WILDCARD_PHRASE.test(lower)) return null;
  const suffix = kebabToCamel(toKebabCase(cleaned));
  if (!suffix) return null;
  return `${category === 'skill' ? 'skills' : 'tools'}.${suffix}`;
}
