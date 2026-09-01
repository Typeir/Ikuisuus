/**
 * @fileoverview Keyword Producer / Consumer Graph
 * @description Reads the `produces` and `consumes` arrays every metadata record
 * carries and turns them into the reverse direction invalidation needs: given a
 * file that changed, which pages hold a baked copy of its prose.
 *
 * A shard is copied into each consuming page at compile, so editing a producer
 * leaves stale prose everywhere it was baked. Revalidating the producer alone
 * fixes nothing downstream.
 *
 * Reads through `keywordLinkRepository`, so the graph follows whichever backend
 * the deployment runs on. Server only.
 *
 * @module lib/db/content/keywordGraph
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import {
  ensureCachesFresh,
  registerServerCache,
} from '@/lib/cache/registry';
import {
  keywordLinkRepository,
  type KeywordLink,
} from './repositories/keywordLinkRepository';

/**
 * The graph, keyed for both directions of the walk.
 *
 * @interface KeywordGraph
 * @property {Map<string, string[]>} produces - File path mapped to the shard ids it defines
 * @property {Map<string, string[]>} producers - Shard id mapped to the file paths defining it
 * @property {Map<string, string[]>} consumers - Shard id mapped to the file paths ingesting it
 * @property {Map<string, string>} links - File path mapped to its route
 * @property {Map<string, string>} files - Route mapped back to its file path
 */
export interface KeywordGraph {
  produces: Map<string, string[]>;
  producers: Map<string, string[]>;
  consumers: Map<string, string[]>;
  links: Map<string, string>;
  files: Map<string, string>;
}

/** Cached graph per locale. Cleared when metadata is regenerated. */
const cache = new Map<string, KeywordGraph>();

registerServerCache('keyword-graph', () => cache.clear());

/**
 * Trims a route to the comparable form: no locale prefix, no trailing slash.
 *
 * The generator stamps `link` without a locale, while a revalidation target
 * arrives with one. Both collapse to the same key here.
 *
 * @param {string} route - Route in either form
 * @returns {string} Normalised route
 */
export function normalizeRoute(route: string): string {
  const trimmed = route.replace(/\/+$/, '');
  const withoutLocale = trimmed.replace(/^\/[a-z]{2}(?=\/|$)/i, '');
  return withoutLocale || '/';
}

/**
 * Builds the graph for a locale, reading every metadata record once.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<KeywordGraph>} The cached graph
 */
export async function loadKeywordGraph(locale: string): Promise<KeywordGraph> {
  await ensureCachesFresh();

  const cached = cache.get(locale);
  if (cached) return cached;

  const records: KeywordLink[] =
    await keywordLinkRepository.listLinks(locale);

  const graph: KeywordGraph = {
    produces: new Map(),
    producers: new Map(),
    consumers: new Map(),
    links: new Map(),
    files: new Map(),
  };

  for (const record of records) {
    const file = record?.file;
    if (!file) continue;

    if (record.link) {
      const route = normalizeRoute(record.link);
      graph.links.set(file, route);
      graph.files.set(route, file);
    }

    if (record.produces?.length) {
      graph.produces.set(file, record.produces);

      for (const key of record.produces) {
        const definers = graph.producers.get(key);
        if (definers) definers.push(file);
        else graph.producers.set(key, [file]);
      }
    }

    for (const key of record.consumes ?? []) {
      const holders = graph.consumers.get(key);
      if (holders) holders.push(file);
      else graph.consumers.set(key, [file]);
    }
  }

  cache.set(locale, graph);
  return graph;
}

/**
 * The file that defines a shard, when exactly one does.
 *
 * A shard id claimed by two files resolves to nothing, the same rule heading
 * slugs follow: an ambiguous reference points nowhere rather than somewhere
 * arbitrary.
 *
 * @param {KeywordGraph} graph - Graph for the locale
 * @param {string} shardId - Shard id, e.g. `kw-condition-blinded`
 * @returns {{ file: string; route: string } | null} The defining file and its route, or null
 *
 * @example
 * producerOf(graph, 'kw--resist');
 * // { file: 'src/content/en/rules/…/effects-and-enhancements.rule.mdx', route: '/library/…' }
 */
export function producerOf(
  graph: KeywordGraph,
  shardId: string,
): { file: string; route: string } | null {
  const definers = graph.producers.get(shardId);
  if (!definers || definers.length !== 1) return null;

  const file = definers[0];
  return { file, route: graph.links.get(file) ?? '' };
}

/**
 * Walks every page holding prose that originates in a changed file.
 *
 * The walk is transitive: a consumer that itself defines shards is followed in
 * turn, since re-baking it can change what its own consumers copied. A visited
 * set makes a cycle terminate rather than recurse, and the starting file is
 * never returned — its own revalidation is the caller's job.
 *
 * @param {KeywordGraph} graph - Graph for the locale
 * @param {string} filePath - File that changed, as `file` was stamped
 * @returns {string[]} Consuming file paths, in breadth-first order
 *
 * @example
 * const graph = await loadKeywordGraph('en');
 * consumersOf(graph, 'src/content/en/rules/steel-and-strife/conditions.rule.mdx');
 * // ['src/content/en/spells/blinding-barrier.spell.mdx', ...]
 */
export function consumersOf(graph: KeywordGraph, filePath: string): string[] {
  const visited = new Set<string>([filePath]);
  const ordered: string[] = [];
  const queue = [filePath];

  while (queue.length > 0) {
    const current = queue.shift() as string;

    for (const key of graph.produces.get(current) ?? []) {
      for (const consumer of graph.consumers.get(key) ?? []) {
        if (visited.has(consumer)) continue;

        visited.add(consumer);
        ordered.push(consumer);
        queue.push(consumer);
      }
    }
  }

  return ordered;
}

/**
 * Routes to revalidate after a page changes, resolved from its own route.
 *
 * @param {string} locale - Locale code
 * @param {string} route - Route of the changed page, with or without a locale
 * @returns {Promise<string[]>} Locale-prefixed routes of every consumer
 */
export async function consumerRoutesFor(
  locale: string,
  route: string,
): Promise<string[]> {
  const graph = await loadKeywordGraph(locale);

  const file = graph.files.get(normalizeRoute(route));
  if (!file) return [];

  return consumersOf(graph, file)
    .map((consumer) => graph.links.get(consumer))
    .filter((link): link is string => Boolean(link))
    .map((link) => `/${locale}${link}`);
}

/**
 * Drops the cached graph so the next read picks up regenerated metadata.
 *
 * @returns {void}
 */
export function clearKeywordGraphCache(): void {
  cache.clear();
}
