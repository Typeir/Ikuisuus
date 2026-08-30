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
 * `remarkKeyword` only rewrites text nodes, so anything in code renders
 * literally; collecting it would bake a shard nothing ever clones.
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
 * A namespaced reference is normalised to `namespace;value`. A bare reference is
 * normalised to its value.
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
 * The key is the shard id the bake dedupes on, so a producer's `produces` and a
 * consumer's `consumes` meet on the same string without either side loading the
 * namespace index. Casing and separator noise collapse into it, so
 * `Two-Weapon Fighting` and `two-weapon-fighting` yield one key.
 *
 * @param {string} source - Raw MDX source
 * @returns {string[]} Shard ids, deduplicated and sorted
 *
 * @example
 * extractConsumedKeys('takes [# kw:condition;Prone #] and [# kw:resist #]');
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
