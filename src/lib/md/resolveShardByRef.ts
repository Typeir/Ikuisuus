/**
 * @fileoverview Shard Resolution
 * @description One pipeline for every shard address: a target names a file, a
 * route, and how to derive its entries; resolution reads that one file and
 * extracts the matching sections. Nothing walks the content tree.
 *
 * A keyword reference is one kind of target: the graph's `produces` arrays say
 * which file defines the shard id, and the entry is the heading whose slug
 * matches the reference's anchor.
 *
 * Server only.
 *
 * @module lib/md/resolveShardByRef
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import { getFile } from '@/lib/db/content/fileTreeService';
import { extractKeywordRefs } from './extractKeywordRefs';
import { bearingAnchor } from './keywordIndexRegistry';
import type { KeywordResolutions } from './remarkKeyword';
import type { ResolvedShard } from '@/lib/types/api';
import {
  loadKeywordGraph,
  producerOf,
} from '@/lib/db/content/keywordGraph';
import {
  resolveShards,
  type ShardableEntry,
} from '@/lib/utils/contentShardResolver';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { KW_NAMESPACED_REGEX } from './keywordExpressionParser';
import { keywordTemplateId } from './keywordIndex';

/** Trailing thematic break left behind by a section boundary. */
const TRAILING_RULE = /\n+\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

/** Matches an ATX heading and captures its level and text. */
const HEADING = /^(#{1,6})\s+(.+?)\s*$/gm;

/** The key that addresses a file's body rather than a section. */
const MAIN_KEY = 'main';

/**
 * Splits a reference into the parts resolution needs.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @returns {{ id: string; anchor: string }} Shard id and the anchor it points at
 *
 * @example
 * partsOf('condition;Blinded'); // { id: 'kw-condition-blinded', anchor: 'blinded' }
 */
function partsOf(reference: string): { id: string; anchor: string } {
  const match = reference.match(KW_NAMESPACED_REGEX);
  const namespace = match ? match[1] : undefined;
  const anchor = anchorSlug(match ? match[2] : reference);

  return { id: keywordTemplateId(namespace, anchor), anchor };
}

/**
 * Shard id for a reference, without consulting anything.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @returns {string} Shard id, e.g. `kw-condition-blinded`
 *
 * @example
 * shardIdOf('condition;Blinded'); // 'kw-condition-blinded'
 */
export function shardIdOf(reference: string): string {
  return partsOf(reference).id;
}

/**
 * Heading text whose slug matches an anchor.
 *
 * The extractor matches on prose, not on slugs, so the anchor has to be turned
 * back into the heading that produced it.
 *
 * @param {string} body - File source
 * @param {string} anchor - Anchor slug to match
 * @returns {string | null} Heading text, or null when the file has no such heading
 */
function headingFor(body: string, anchor: string): string | null {
  const pattern = new RegExp(HEADING.source, 'gm');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    if (anchorSlug(text) === anchor) return text;
  }

  return null;
}

/**
 * A resolvable shard address: the file holding the prose, the route serving
 * it, and how its entries derive from the content.
 *
 * @interface ShardTarget
 * @property {string} file - Content file path as the metadata stamped it
 * @property {string} route - Route of the page, without a locale prefix
 * @property {(content: string) => ShardableEntry[]} entriesOf - Shardable entries; derived after the read so a target may match against the content itself
 * @property {string[] | ((entries: ShardableEntry[]) => string[])} [keys] - Fixed keys this target resolves, or keys derived from its own entries; callers' requested keys apply when omitted
 * @property {(anchor: string) => string} [shardId] - Shard id for an anchor; the anchor itself when omitted
 */
export interface ShardTarget {
  file: string;
  route: string;
  entriesOf: (content: string) => ShardableEntry[];
  keys?: string[] | ((entries: ShardableEntry[]) => string[]);
  shardId?: (anchor: string) => string;
}

/**
 * Resolves a target's shards from its one file.
 *
 * Reads the file, derives entries, extracts the requested sections, and wraps
 * each in its identity: id, key, heading, and href. Empty extractions are
 * dropped; a trailing thematic break left by a section boundary is trimmed.
 *
 * @param {ShardTarget} target - Address to resolve
 * @param {string} locale - Content locale
 * @param {string[]} [requestedKeys] - Keys to resolve when the target fixes none; all when omitted
 * @returns {Promise<ResolvedShard[] | null>} Resolved shards, or null when the file is missing
 *
 * @example
 * await resolveTargetShards(target, 'en', ['Rage']);
 * // [{ id: 'rage', key: 'Rage', heading: 'Rage', source: '…', href: 'library/…#rage' }]
 */
export async function resolveTargetShards(
  target: ShardTarget,
  locale: string,
  requestedKeys?: string[],
): Promise<ResolvedShard[] | null> {
  const file = await getFile(locale, target.file);
  if (!file) return null;

  const entries = target.entriesOf(file.content);
  const keys =
    typeof target.keys === 'function' ? target.keys(entries) : target.keys;

  /* A target that names its keys and comes up empty resolves to nothing; the
     extractor reads an empty list as "every entry" and would return the body. */
  if (keys && keys.length === 0) return [];

  const prose = resolveShards(file.content, entries, keys ?? requestedKeys);
  const route = target.route.replace(/^\//, '');

  const shards: ResolvedShard[] = [];
  for (const [key, block] of Object.entries(prose)) {
    const source = block.trim().replace(TRAILING_RULE, '').trimEnd();
    if (!source) continue;

    const entry =
      entries.find((e) => e.anchor === key) ??
      entries.find((e) => e.name === key);
    const heading = entry?.name ?? key;
    const anchor =
      key === MAIN_KEY ? '' : (entry?.anchor ?? anchorSlug(heading));

    shards.push({
      id: anchor ? (target.shardId?.(anchor) ?? anchor) : MAIN_KEY,
      key,
      heading,
      source,
      href: anchor ? `${route}#${anchor}` : route,
    });
  }

  return shards;
}

/**
 * Target for a keyword reference: the graph names the producing file, and the
 * entry is the heading bearing the reference's term.
 *
 * The bearing heading is usually titled after the term. A `term: Heading Text`
 * declaration points elsewhere, so the entry keeps the heading's own anchor and
 * the href lands on the section a reader would scroll to, while the shard keeps
 * the id the reference computes.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @param {string} locale - Content locale
 * @returns {Promise<ShardTarget | null>} The target, or null when nothing produces the shard
 */
export async function keywordTarget(
  reference: string,
  locale: string,
): Promise<ShardTarget | null> {
  const { id, anchor } = partsOf(reference);

  const graph = await loadKeywordGraph(locale);
  const producer = producerOf(graph, id);
  if (!producer) return null;

  return {
    file: producer.file,
    route: producer.route,
    entriesOf: (content) => {
      const bearer = bearingAnchor(content, anchor);
      const heading = headingFor(content, bearer);
      return heading ? [{ name: heading, anchor: bearer }] : [];
    },
    keys: (entries) => entries.map((entry) => entry.anchor ?? entry.name),
    shardId: () => id,
  };
}

/**
 * Resolves one reference to the prose that defines it.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @param {string} locale - Content locale
 * @returns {Promise<ResolvedShard | null>} The shard, or null when it resolves to nothing
 *
 * @example
 * await resolveShardByRef('condition;blinded', 'en');
 * // { id: 'kw-condition-blinded', key: 'blinded', heading: 'Blinded', source: '…', href: 'library/…#blinded' }
 */
export async function resolveShardByRef(
  reference: string,
  locale: string,
): Promise<ResolvedShard | null> {
  const target = await keywordTarget(reference, locale);
  if (!target) return null;

  const shards = await resolveTargetShards(target, locale);
  return shards?.[0] ?? null;
}

/**
 * Everything a document needs to render its own keywords.
 *
 * @interface DocumentKeywords
 * @property {ResolvedShard[]} shards - Prose for each reference, carried to the page
 * @property {KeywordResolutions} resolutions - Targets for the plugin to stamp
 */
export interface DocumentKeywords {
  shards: ResolvedShard[];
  resolutions: KeywordResolutions;
}

/**
 * Resolves every keyword a document writes. Shards are deduplicated by id, so
 * two spellings of one term carry one shard; every reference spelling still
 * receives its own resolution stamp.
 *
 * Only the references in the given source. One living inside a resolved shard
 * is left for the endpoint, requested when its card opens: following them here
 * would pull each shard's dependencies onto the page, and theirs after that,
 * until every page carried the whole corpus.
 *
 * @param {string} source - Document source, after reusable regions are inlined
 * @param {string} locale - Content locale
 * @returns {Promise<DocumentKeywords>} Shards and the stamps that point at them
 *
 * @example
 * const { shards, resolutions } = await resolveDocumentKeywords(source, 'en');
 */
export async function resolveDocumentKeywords(
  source: string,
  locale: string,
): Promise<DocumentKeywords> {
  const references = extractKeywordRefs(source);
  if (references.length === 0) return { shards: [], resolutions: {} };

  const resolved = await Promise.all(
    references.map(async (reference) => ({
      reference,
      shard: await resolveShardByRef(reference, locale),
    })),
  );

  const shards: ResolvedShard[] = [];
  const resolutions: KeywordResolutions = {};
  const seen = new Set<string>();

  for (const { reference, shard } of resolved) {
    if (!shard) continue;

    if (!seen.has(shard.id)) {
      seen.add(shard.id);
      shards.push(shard);
    }
    resolutions[reference] = {
      href: shard.href,
      templateId: shard.id,
      heading: shard.heading,
    };
  }

  return { shards, resolutions };
}
