/**
 * @fileoverview Collects `[# kw:… #]` references from MDX source.
 * @description Unlike `parseKeywordExpression`, this reports unregistered and
 * unresolvable references too, so validation can find references that point at
 * nothing. Namespaced references keep their `namespace;value` form; resolution to
 * a file and anchor happens against the namespace index.
 *
 * @module lib/md/extractKeywordRefs
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  KEYWORD_EXPR_REGEX,
  parseKeywordReference,
} from './keywordExpressionParser';

/**
 * Collects every keyword reference in a source document.
 *
 * A namespaced reference is normalised to `namespace;value`. A bare reference is
 * normalised to its value.
 *
 * @param {string} source - Raw MDX source
 * @returns {string[]} Normalised references, deduplicated and sorted
 */
export function extractKeywordRefs(source: string): string[] {
  const refs = new Set<string>();
  const pattern = new RegExp(KEYWORD_EXPR_REGEX.source, 'g');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const inner = match[1]?.trim();
    if (!inner) continue;

    const reference = parseKeywordReference(inner);
    if (!reference) continue;

    refs.add(
      reference.namespace
        ? `${reference.namespace};${reference.value}`
        : reference.value,
    );
  }

  return [...refs].sort();
}
