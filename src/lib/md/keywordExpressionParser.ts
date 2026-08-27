/**
 * Keyword Expression Parser
 *
 * @fileoverview Splits `[# kw:... #]` keyword blocks into their parts.
 * @description Resolution is the caller's job; this layer only parses.
 * @module lib/md/keywordExpressionParser
 * @version 3.0.0
 * @author Typeir
 * @since 2026-08-19
 */

/**
 * Normalizes a raw keyword to its canonical lookup form.
 *
 * @param {string} raw - Author-written keyword text, any casing
 * @returns {string} Lowercased text with inner whitespace collapsed
 */
export function normalizeKeyword(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Regex to match `[# ... #]` delimited keyword expressions in text. Non-greedy inner capture. */
export const KEYWORD_EXPR_REGEX = /\[#\s*(.*?)\s*#\]/g;

/** Regex to match the `kw:` marker and capture the reference text. */
export const KW_INNER_REGEX = /^kw:\s*(.+)$/;

/** Regex splitting a namespaced reference into namespace and value on the semicolon. */
export const KW_NAMESPACED_REGEX = /^([^;]+);(.+)$/;

/**
 * A keyword reference split into its parts.
 *
 * @interface KeywordReference
 * @property {string} [namespace] - Namespace when the reference is namespaced, e.g. "condition"
 * @property {string} value - Normalised lookup value
 * @property {string} display - Text to render, with author casing preserved
 */
export interface KeywordReference {
  namespace?: string;
  value: string;
  display: string;
}

/**
 * Splits the inner content of a `[# ... #]` block into its keyword parts.
 * Performs no registry lookup.
 *
 * @param {string} inner - The raw content between `[#` and `#]`
 * @returns {KeywordReference | null} Reference parts, or null when malformed
 *
 * @example
 * parseKeywordReference('kw:condition;Prone')
 * // { namespace: 'condition', value: 'prone', display: 'Prone' }
 * parseKeywordReference('kw:damage bonus')
 * // { value: 'damage bonus', display: 'damage bonus' }
 * parseKeywordReference('kw:;prone')
 * // null — a stray semicolon means a botched namespace
 */
export function parseKeywordReference(inner: string): KeywordReference | null {
  const match = inner.trim().match(KW_INNER_REGEX);
  if (!match) return null;

  const reference = match[1].trim();
  const namespaced = reference.match(KW_NAMESPACED_REGEX);

  if (namespaced) {
    const namespace = normalizeKeyword(namespaced[1]);
    const display = namespaced[2].trim();
    const value = normalizeKeyword(display);
    if (!namespace || !value) return null;
    return { namespace, value, display };
  }

  if (reference.includes(';')) return null;

  const value = normalizeKeyword(reference);
  if (!value) return null;
  return { value, display: reference };
}
