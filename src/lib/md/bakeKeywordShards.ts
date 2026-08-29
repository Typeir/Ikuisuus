/**
 * Keyword Shard Baking
 *
 * @fileoverview Collects the prose of every keyword a document references, so a
 * hover costs no request. Prose ships as source and the card compiles it, which
 * keeps `Unit`, `DiceRoll` and nested keywords as live components.
 *
 * Sections are extracted with `resolveShards`, the same call the content shard
 * routes make.
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

/** Splits a normalised reference back into its namespace and value. */
const REF_PARTS = /^([^;]+);(.+)$/;

/** Trailing thematic break left behind by a section boundary. */
const TRAILING_RULE = /\n+\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

/**
 * A resolved shard, carried as source.
 *
 * The heading stays out of `source` so the card owns its own title element.
 *
 * @interface KeywordShard
 * @property {string} id - Shard key, derived from namespace and anchor
 * @property {string} heading - Heading text of the defining section
 * @property {string} source - Section body markdown, without the heading
 */
export interface KeywordShard {
  id: string;
  heading: string;
  source: string;
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
 * Resolves every keyword a document references into a shard.
 * Deduplicated by id, so a term used many times resolves once.
 *
 * @param {string} source - Document source, after reusable regions are inlined
 * @param {KeywordRegistry} registry - Discovered namespaces
 * @param {string} locale - Content locale
 * @returns {Promise<KeywordShard[]>} Shards, in reference order
 */
export async function collectKeywordShards(
  source: string,
  registry: KeywordRegistry,
  locale: string,
): Promise<KeywordShard[]> {
  const shards = new Map<string, KeywordShard>();

  for (const reference of extractKeywordRefs(source)) {
    const { namespace, value } = splitRef(reference);
    const target = resolveKeywordRef(registry, namespace, value);
    if (!target) continue;

    const id = keywordTemplateId(namespace, target.anchor);
    if (shards.has(id)) continue;

    const prose = await readShard(target, locale);
    if (!prose) continue;

    shards.set(id, { id, heading: target.heading, source: prose });
  }

  return [...shards.values()];
}
