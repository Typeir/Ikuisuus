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
 * A term a document defines, and the heading that carries its prose.
 *
 * @interface DeclaredKeyword
 * @property {string} term - Term references are written with
 * @property {string} heading - Text of the heading bearing the definition
 */
export interface DeclaredKeyword {
  term: string;
  heading: string;
}

/**
 * Reads the declared terms from a `keywords` frontmatter value.
 *
 * A term is usually its own heading. A `term: Heading Text` entry names a
 * different bearer, for a definition whose section is not titled after the term
 * — a page-wide term borne by the `H1`, say.
 *
 * @param {unknown} raw - Frontmatter value: a list, a comma-separated string, or entries mapping a term to its heading
 * @returns {DeclaredKeyword[]} Declared terms paired with their bearing heading
 *
 * @example
 * declaredTerms(['resist', { disposition: 'Disposition, Reputation and Attitude' }]);
 * // [{ term: 'resist', heading: 'resist' }, { term: 'disposition', heading: 'Disposition, …' }]
 */
export function declaredTerms(raw: unknown): DeclaredKeyword[] {
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : [];

  const declared: DeclaredKeyword[] = [];

  for (const item of items) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const [term, heading] of Object.entries(item)) {
        const key = term.trim();
        const bearer = String(heading).trim();
        if (key && bearer) declared.push({ term: key, heading: bearer });
      }
      continue;
    }

    const term = String(item).trim();
    if (term) declared.push({ term, heading: term });
  }

  return declared;
}

/**
 * Slug of the heading bearing a term, for a reference that already resolved to
 * this document.
 *
 * Resolution addresses a shard by the term's own slug; extraction needs the
 * heading's. The two differ only for a `term: Heading Text` declaration.
 *
 * @param {string} source - Raw MDX source, frontmatter included
 * @param {string} anchor - Slug of the referenced term
 * @returns {string} Slug of the bearing heading, the given anchor when nothing remaps it
 *
 * @example
 * bearingAnchor(source, 'disposition'); // 'disposition-reputation-and-attitude'
 */
export function bearingAnchor(source: string, anchor: string): string {
  const { data } = matter(source);

  for (const { term, heading } of declaredTerms(data.keywords)) {
    if (anchorSlug(term) === anchor) return anchorSlug(heading);
  }

  return anchor;
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

  for (const { term, heading } of terms) {
    if (!headings.has(anchorSlug(heading))) continue;
    keys.add(keywordTemplateId(undefined, anchorSlug(term)));
  }

  return [...keys].sort();
}
