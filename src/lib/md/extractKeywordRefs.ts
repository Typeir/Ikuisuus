/**
 * @fileoverview Collects `[# kw:… #]` references from MDX source.
 * @description Unlike `parseKeywordExpression`, this reports unregistered terms
 * too, so validation can find references that resolve to nothing.
 *
 * @module lib/md/extractKeywordRefs
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { KEYWORD_EXPR_REGEX } from './keywordExpressionParser';
import { normalizeKeyword } from './keywordRegistry';

/** Matches the `kw:` prefix and captures everything after it. */
const KW_PREFIX_REGEX = /^kw:\s*(.+)$/;

/**
 * Collects every keyword term referenced in a source document.
 *
 * @param {string} source - Raw MDX source
 * @returns {string[]} Normalised terms, deduplicated and sorted
 */
export function extractKeywordRefs(source: string): string[] {
  const terms = new Set<string>();
  const pattern = new RegExp(KEYWORD_EXPR_REGEX.source, 'g');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const inner = match[1]?.trim();
    if (!inner) continue;

    const kw = inner.match(KW_PREFIX_REGEX);
    if (!kw) continue;

    const term = normalizeKeyword(kw[1]);
    if (term) terms.add(term);
  }

  return [...terms].sort();
}
