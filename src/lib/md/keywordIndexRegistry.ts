/**
 * Keyword Index Registry
 *
 * @fileoverview Discovers content files that declare keyword definitions in
 * frontmatter. A file contributes nothing until it says so: `keywordIndex:
 * <name>` contributes every heading in the file to that namespace, and
 * `keywords: [<term>, ...]` contributes named terms to the bare namespace. A
 * declared term with no matching heading throws, so a typo fails the build
 * rather than dropping a keyword silently.
 *
 * Holds pointers only; shard prose is fetched separately.
 *
 * Server only, since discovery reads the content tree through the content and
 * directory ports. Shapes and lookups live in `keywordIndex`, which is safe to
 * bundle for the client.
 *
 * @module lib/md/keywordIndexRegistry
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { getFile, listDirectory } from '@/lib/db/content/fileTreeService';
import matter from 'gray-matter';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  BARE_NAMESPACE,
  contributeKeyword,
  keywordTemplateId,
  type KeywordRegistry,
} from './keywordIndex';

/** Matches an ATX heading and captures its level and text. */
const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;

/** Cached discovery result, keyed by locale. */
const cache = new Map<string, KeywordRegistry>();

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
 * Recursively lists MDX files beneath a content directory.
 *
 * Walks through the directory port, so discovery follows whichever content
 * source the deployment runs rather than assuming a filesystem.
 *
 * @param {string} locale - Locale code
 * @param {string} dir - Path relative to the locale root
 * @returns {Promise<string[]>} Locale-relative paths of every .mdx file found
 */
async function listMdxFiles(locale: string, dir = ''): Promise<string[]> {
  const { entries } = await listDirectory(locale, dir);

  const nested = await Promise.all(
    entries.map((entry) => {
      const full = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory) return listMdxFiles(locale, full);
      return Promise.resolve(entry.name.endsWith('.mdx') ? [full] : []);
    }),
  );

  return nested.flat();
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
 * one per declared term. A declared term with no matching heading is skipped
 * here rather than thrown on, since stamping runs over every content file and
 * discovery is where that check belongs.
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

/**
 * Discovers every declared keyword namespace beneath a content root. Several
 * files may declare the same namespace; their values merge.
 *
 * @param {string} locale - Locale code, e.g. `en`
 * @returns {Promise<KeywordRegistry>} Namespace mapped to its contents
 * @throws {Error} When a declared term has no matching heading in its file
 */
export async function discoverKeywordIndexes(
  locale: string,
): Promise<KeywordRegistry> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const registry: KeywordRegistry = new Map();
  const files = await listMdxFiles(locale);

  for (const relative of files) {
    const file = await getFile(locale, relative);
    if (!file) continue;

    const { data, content } = matter(file.content);

    const namespace =
      typeof data.keywordIndex === 'string'
        ? data.keywordIndex.trim().toLowerCase()
        : null;
    const terms = declaredTerms(data.keywords);

    if (!namespace && terms.length === 0) continue;

    const headings = headingValues(content);

    if (namespace) {
      for (const [anchor, heading] of headings) {
        contributeKeyword(registry, namespace, {
          anchor,
          heading,
          filePath: relative,
        });
      }
    }

    for (const term of terms) {
      const anchor = anchorSlug(term);
      const heading = headings.get(anchor);
      if (!heading) {
        throw new Error(
          `keywords: "${term}" in ${relative} has no matching heading (expected #${anchor})`,
        );
      }
      contributeKeyword(registry, BARE_NAMESPACE, {
        anchor,
        heading,
        filePath: relative,
      });
    }
  }

  cache.set(locale, registry);
  return registry;
}

/**
 * Clears the discovery cache.
 *
 * @returns {void}
 */
export function clearKeywordIndexCache(): void {
  cache.clear();
}
