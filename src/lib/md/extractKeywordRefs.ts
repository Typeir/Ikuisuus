/**
 * @fileoverview Collects `[# kw:… #]` references from MDX source.
 * @description Unlike `parseKeywordExpression`, this reports unregistered and
 * unresolvable references too, so validation can find references that point at
 * nothing.
 *
 * @module lib/md/extractKeywordRefs
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  KEYWORD_EXPR_REGEX,
  parseKeywordReference,
} from './keywordExpressionParser';
import { keywordTemplateId } from './keywordIndex';

/** Fenced blocks and inline spans, whose contents are shown rather than parsed. */
const CODE_SPANS = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g;

/**
 * Blanks out code so a reference quoted as an example is not collected.
 *
 * @param {string} source - Raw MDX source
 * @returns {string} Source with code spans replaced by blanks of equal length
 */
function maskCode(source: string): string {
  return source.replace(CODE_SPANS, (span) => ' '.repeat(span.length));
}

/**
 * Collects every keyword reference in a source document.
 *
 * @param {string} source - Raw MDX source
 * @returns {string[]} Normalised references, deduplicated and sorted
 */
export function extractKeywordRefs(source: string): string[] {
  const refs = new Set<string>();
  const pattern = new RegExp(KEYWORD_EXPR_REGEX.source, 'g');
  const prose = maskCode(source);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(prose)) !== null) {
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

/**
 * Collects the join keys for every keyword a document ingests.
 *
 * @param {string} source - Raw MDX source
 * @returns {string[]} Shard ids, deduplicated and sorted
 *
 * @example
 * extractConsumedKeys('takes [# kw:condition:Prone #] and [# kw:resist #]');
 * // ['kw--resist', 'kw-condition-prone']
 */
export function extractConsumedKeys(source: string): string[] {
  const keys = new Set<string>();
  const pattern = new RegExp(KEYWORD_EXPR_REGEX.source, 'g');
  const prose = maskCode(source);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(prose)) !== null) {
    const inner = match[1]?.trim();
    if (!inner) continue;

    const reference = parseKeywordReference(inner);
    if (!reference) continue;

    keys.add(
      keywordTemplateId(reference.namespace, anchorSlug(reference.value)),
    );
  }

  return [...keys].sort();
}
