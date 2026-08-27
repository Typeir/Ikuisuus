/**
 * Keyword Expression Parser
 *
 * @fileoverview Parses `[# kw:... #]` keyword blocks from text.
 * @module lib/md/keywordExpressionParser
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-19
 */

import { lookupKeyword, normalizeKeyword } from './keywordRegistry';

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
 * Parsed keyword expression result.
 *
 * @interface ParsedKeywordExpression
 * @property {string} [namespace] - Namespace when the reference is namespaced
 * @property {string} term - Canonical lookup term
 * @property {string} display - Text to render, with author casing preserved
 */
export interface ParsedKeywordExpression {
  namespace?: string;
  term: string;
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

  const value = normalizeKeyword(reference);
  if (!value) return null;
  return { value, display: reference };
}

/**
 * Parses a keyword expression for rendering. A namespaced reference resolves
 * against the namespace index and needs no registry entry; a bare reference must
 * be registered.
 *
 * @param {string} inner - The raw content between `[#` and `#]`
 * @returns {ParsedKeywordExpression | null} Parsed expression, or null when malformed or unregistered
 *
 * @example
 * parseKeywordExpression('kw:condition;prone')
 * // { namespace: 'condition', term: 'prone', display: 'prone' }
 * parseKeywordExpression('kw:accuracy')   // { term: 'accuracy', display: 'accuracy' }
 * parseKeywordExpression('kw:swiftness')  // null — unregistered bare keyword
 */
export function parseKeywordExpression(
  inner: string,
): ParsedKeywordExpression | null {
  const reference = parseKeywordReference(inner);
  if (!reference) return null;

  if (reference.namespace) {
    return {
      namespace: reference.namespace,
      term: reference.value,
      display: reference.display,
    };
  }

  const entry = lookupKeyword(reference.value);
  if (!entry) return null;

  return { term: entry.term, display: reference.display };
}
