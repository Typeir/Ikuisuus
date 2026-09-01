/**
 * Keyword Index Registry
 *
 * @fileoverview Extracts the keyword join keys a content file produces from
 * its frontmatter declarations: `keywordIndex: <name>` keys every heading in
 * the file, `keywords: [<term>, ...]` keys named terms in the bare namespace.
 * Build-time generators stamp `produces` arrays with these keys; runtime
 * resolution reads them back through the keyword graph.
 *
 * Server only.
 *
 * @module lib/md/keywordIndexRegistry
 * @version 4.0.0
 * @author Typeir
 * @since 8.0.0
 */

import matter from 'gray-matter';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { keywordTemplateId } from './keywordIndex';

/** Matches an ATX heading and captures its level and text. */
const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;

/**
 * Collects heading slugs from a document body.
 *
 * @param {string} body - MDX source with frontmatter removed
 * @returns {Map<string, string>} Slug mapped to heading text
 */
function headingValues(body: string): Map<string, string> {
  const values = new Map<string, string>();
  const pattern = new RegExp(HEADING_REGEX.source, 'gm');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    const slug = anchorSlug(text);
    if (slug && !values.has(slug)) values.set(slug, text);
  }

  return values;
}

/**
 * Reads the declared terms from a `keywords` frontmatter value.
 *
 * @param {unknown} raw - Frontmatter value, a list or a comma-separated string
 * @returns {string[]} Declared terms, trimmed and non-empty
 */
function declaredTerms(raw: unknown): string[] {
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : [];

  return items
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

/**
 * Collects the join keys for every keyword a document defines.
 *
 * Mirrors {@link extractConsumedKeys}: the same shard ids, from the other side
 * of the reference. `keywordIndex` yields one key per heading; `keywords` yields
 * one per declared term. A declared term with no matching heading contributes
 * nothing.
 *
 * @param {string} source - Raw MDX source, frontmatter included
 * @returns {string[]} Shard ids, deduplicated and sorted
 *
 * @example
 * extractProducedKeys('---
keywords:
  - resist
---

### Resist
');
 * // ['kw--resist']
 */
export function extractProducedKeys(source: string): string[] {
  const { data, content } = matter(source);

  const namespace =
    typeof data.keywordIndex === 'string'
      ? data.keywordIndex.trim().toLowerCase()
      : null;
  const terms = declaredTerms(data.keywords);
  if (!namespace && terms.length === 0) return [];

  const headings = headingValues(content);
  const keys = new Set<string>();

  if (namespace) {
    for (const anchor of headings.keys()) {
      keys.add(keywordTemplateId(namespace, anchor));
    }
  }

  for (const term of terms) {
    const anchor = anchorSlug(term);
    if (headings.has(anchor)) keys.add(keywordTemplateId(undefined, anchor));
  }

  return [...keys].sort();
}
