/**
 * Keyword Expression Parser
 *
 * @fileoverview Parses `[# kw:... #]` keyword blocks from text.
 * @module lib/md/keywordExpressionParser
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 */

import { lookupKeyword } from './keywordRegistry';

/** Regex to match `[# ... #]` delimited keyword expressions in text. Non-greedy inner capture. */
export const KEYWORD_EXPR_REGEX = /\[#\s*(.*?)\s*#\]/g;

/** Regex to match the `kw:` marker and capture the keyword text. */
const KW_INNER_REGEX = /^kw:\s*(.+)$/;

/**
 * Parsed keyword expression result.
 *
 * @interface ParsedKeywordExpression
 * @property {string} term - Canonical registry term, e.g. "damage bonus"
 * @property {string} display - Author-written text with casing preserved, e.g. "Damage Bonus"
 */
export interface ParsedKeywordExpression {
  term: string;
  display: string;
}

/**
 * Parses a keyword expression from the inner content of a `[# ... #]` block.
 * Returns null for malformed, empty, or unregistered keywords.
 *
 * @param {string} inner - The raw content between `[#` and `#]`, e.g. "kw:accuracy"
 * @returns {ParsedKeywordExpression | null} Parsed expression or null if malformed
 *
 * @example
 * parseKeywordExpression('kw:accuracy')      // { term: 'accuracy', display: 'accuracy' }
 * parseKeywordExpression('kw:Briefly')       // { term: 'briefly', display: 'Briefly' }
 * parseKeywordExpression('kw:damage bonus')  // { term: 'damage bonus', display: 'damage bonus' }
 * parseKeywordExpression('kw:swiftness')     // null — unregistered keyword
 * parseKeywordExpression('accuracy')         // null — missing kw: marker
 * parseKeywordExpression('')                 // null — empty
 */
export function parseKeywordExpression(
  inner: string,
): ParsedKeywordExpression | null {
  const match = inner.trim().match(KW_INNER_REGEX);
  if (!match) {
    return null;
  }

  const display = match[1].trim();
  const entry = lookupKeyword(display);
  if (!entry) {
    return null;
  }

  return { term: entry.term, display };
}
