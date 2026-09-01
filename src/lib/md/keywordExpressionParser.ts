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

/**
 * Regex splitting a NORMALISED reference (`namespace;value`) into its parts.
 * The normalised form is internal — extractor output, resolution keys, the
 * shard URL — and keeps `;` as its separator. The author grammar is parsed by
 * {@link parseKeywordReference} and uses `:` between namespace and value,
 * with `;` cutting off a display override.
 */
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
 * Grammar: `kw:` marker, then the target — `namespace:value` or a bare value —
 * then an optional `;display` override. The target always comes first, so `;`
 * is free to carry the rendered text; the override keeps its author casing and
 * never enters the reference's identity.
 *
 * @param {string} inner - The raw content between `[#` and `#]`
 * @returns {KeywordReference | null} Reference parts, or null when malformed
 *
 * @example
 * parseKeywordReference('kw:condition:Prone')
 * // { namespace: 'condition', value: 'prone', display: 'Prone' }
 * parseKeywordReference('kw:condition:bleeding;the dog bleeds')
 * // { namespace: 'condition', value: 'bleeding', display: 'the dog bleeds' }
 * parseKeywordReference('kw:damage bonus')
 * // { value: 'damage bonus', display: 'damage bonus' }
 * parseKeywordReference('kw:bleeding;')
 * // null — a display cut with nothing after it is a botched override
 */
export function parseKeywordReference(inner: string): KeywordReference | null {
  const match = inner.trim().match(KW_INNER_REGEX);
  if (!match) return null;

  const reference = match[1].trim();

  const cut = reference.indexOf(';');
  const target = (cut === -1 ? reference : reference.slice(0, cut)).trim();
  const override = cut === -1 ? null : reference.slice(cut + 1).trim();
  if (!target || (cut !== -1 && !override)) return null;

  const namespaceCut = target.indexOf(':');
  if (namespaceCut !== -1) {
    const namespace = normalizeKeyword(target.slice(0, namespaceCut));
    const valueText = target.slice(namespaceCut + 1).trim();
    const value = normalizeKeyword(valueText);
    if (!namespace || !value) return null;
    return { namespace, value, display: override ?? valueText };
  }

  const value = normalizeKeyword(target);
  if (!value) return null;
  return { value, display: override ?? target };
}
