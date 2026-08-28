/**
 * Keyword Shard Baking
 *
 * @fileoverview Collects the prose of every keyword a document references and
 * renders it to HTML, ready to ship inside the page as an inert `<template>`.
 * A keyword hover then costs a clone rather than a request.
 *
 * Sections are extracted with `resolveShards`, the same call the content shard
 * routes make. Shards are rendered to an HTML string rather than left as MDX
 * because React must not own a template's children: the HTML parser moves them
 * into `content`, so a React-managed template fails hydration.
 *
 * Server only.
 *
 * @module lib/md/bakeKeywordShards
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { extractKeywordRefs } from './extractKeywordRefs';
import {
  keywordTemplateId,
  resolveKeywordRef,
  type KeywordRegistry,
  type KeywordValue,
} from './keywordIndex';
import { renderMarkdownToHtml } from './renderMarkdownToHtml';

/** Splits a normalised reference back into its namespace and value. */
const REF_PARTS = /^([^;]+);(.+)$/;

/** Trailing thematic break left behind by a section boundary. */
const TRAILING_RULE = /\n+\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

/** Tag appended to a document that references at least one resolvable keyword. */
export const KEYWORD_SHARDS_TAG = 'KeywordShardTemplates';

/**
 * A shard resolved and rendered, ready to bake.
 *
 * The heading stays out of `html` so the consuming card owns its own title
 * element and can size it as a heading rather than as bold body text.
 *
 * @interface BakedShard
 * @property {string} id - Template element id
 * @property {string} heading - Heading text of the defining section
 * @property {string} html - Rendered section body, without the heading
 */
export interface BakedShard {
  id: string;
  heading: string;
  html: string;
}

/**
 * A document's source with its shards resolved.
 *
 * @interface BakeResult
 * @property {string} source - Source, with the templates tag appended when there is anything to bake
 * @property {BakedShard[]} shards - Shards the document references
 */
export interface BakeResult {
  source: string;
  shards: BakedShard[];
}

/**
 * Splits a normalised reference into namespace and value.
 *
 * @param {string} reference - Reference as `namespace;value` or a bare value
 * @returns {{ namespace: string | undefined; value: string }} Reference parts
 */
function splitRef(reference: string): {
  namespace: string | undefined;
  value: string;
} {
  const match = reference.match(REF_PARTS);
  return match
    ? { namespace: match[1], value: match[2] }
    : { namespace: undefined, value: reference };
}

/**
 * Reads the defining section for one resolved reference.
 *
 * @param {KeywordValue} target - Resolved pointer to the defining heading
 * @param {string} locale - Content locale
 * @returns {Promise<string | null>} Section body, or null when it cannot be read
 */
async function readShard(
  target: KeywordValue,
  locale: string,
): Promise<string | null> {
  const file = await getFile(locale, target.filePath);
  if (!file) return null;

  const shards = resolveShards(
    file.content,
    [{ name: target.heading, anchor: target.anchor }],
    [target.anchor],
  );

  const prose = shards[target.anchor]?.trim();
  return prose ? prose.replace(TRAILING_RULE, '').trimEnd() || null : null;
}

/**
 * Resolves every keyword a document references into a rendered shard.
 * Deduplicated by template id, so a term used many times bakes once.
 *
 * @param {string} source - Document source, after reusable regions are inlined
 * @param {KeywordRegistry} registry - Discovered namespaces
 * @param {string} locale - Content locale
 * @returns {Promise<BakedShard[]>} Shards to bake, in reference order
 */
export async function collectKeywordShards(
  source: string,
  registry: KeywordRegistry,
  locale: string,
): Promise<BakedShard[]> {
  const shards = new Map<string, BakedShard>();

  for (const reference of extractKeywordRefs(source)) {
    const { namespace, value } = splitRef(reference);
    const target = resolveKeywordRef(registry, namespace, value);
    if (!target) continue;

    const id = keywordTemplateId(namespace, target.anchor);
    if (shards.has(id)) continue;

    const prose = await readShard(target, locale);
    if (!prose) continue;

    const html = await renderMarkdownToHtml(prose);
    shards.set(id, { id, heading: target.heading, html });
  }

  return [...shards.values()];
}

/**
 * Resolves a document's keyword shards and appends the tag that renders them.
 *
 * @param {string} source - Document source, after reusable regions are inlined
 * @param {KeywordRegistry} registry - Discovered namespaces
 * @param {string} [locale] - Content locale
 * @returns {Promise<BakeResult>} Source and the shards it references
 */
export async function bakeKeywordShards(
  source: string,
  registry: KeywordRegistry,
  locale = 'en',
): Promise<BakeResult> {
  const shards = await collectKeywordShards(source, registry, locale);
  if (shards.length === 0) return { source, shards };

  return { source: `${source}\n\n<${KEYWORD_SHARDS_TAG} />\n`, shards };
}
