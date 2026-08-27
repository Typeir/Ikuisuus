/**
 * Keyword Index Registry
 *
 * @fileoverview Discovers content files that declare keyword definitions in
 * frontmatter. `keywordIndex: <name>` contributes every heading in the file to
 * that namespace. `keywords: [<term>, ...]` contributes named terms to the bare
 * namespace. Holds pointers only; shard prose is fetched separately.
 *
 * Server only, since discovery reads the content tree. Shapes and lookups live
 * in `keywordIndex`, which is safe to bundle for the client.
 *
 * @module lib/md/keywordIndexRegistry
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import {
  BARE_NAMESPACE,
  contributeKeyword,
  type KeywordRegistry,
} from './keywordIndex';

/** Matches an ATX heading and captures its level and text. */
const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;

/** Cached discovery result, keyed by content root. */
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
 * Recursively lists MDX files beneath a directory.
 *
 * @param {string} dir - Directory to walk
 * @returns {Promise<string[]>} Absolute paths of every .mdx file found
 */
async function listMdxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMdxFiles(full);
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
 * Discovers every declared keyword namespace beneath a content root. Several
 * files may declare the same namespace; their values merge.
 *
 * @param {string} contentRoot - Locale root, e.g. `src/content/en`
 * @returns {Promise<KeywordRegistry>} Namespace mapped to its contents
 * @throws {Error} When a declared term has no matching heading in its file
 */
export async function discoverKeywordIndexes(
  contentRoot: string,
): Promise<KeywordRegistry> {
  const cached = cache.get(contentRoot);
  if (cached) return cached;

  const registry: KeywordRegistry = new Map();
  const files = await listMdxFiles(contentRoot);

  for (const filePath of files) {
    const source = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(source);

    const namespace =
      typeof data.keywordIndex === 'string'
        ? data.keywordIndex.trim().toLowerCase()
        : null;
    const terms = declaredTerms(data.keywords);
    if (!namespace && terms.length === 0) continue;

    const relative = path
      .relative(contentRoot, filePath)
      .split(path.sep)
      .join('/');
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

  cache.set(contentRoot, registry);
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
