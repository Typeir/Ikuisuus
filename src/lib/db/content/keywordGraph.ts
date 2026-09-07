/**
 * @fileoverview Keyword Producer / Consumer Graph
 * @description Reads the `produces` and `consumes` arrays every metadata record
 * carries and turns them into the reverse direction invalidation needs: given a
 * file that changed, which pages hold a baked copy of its prose.
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

/** Cached graph per locale. */
const cache = new Map<string, KeywordGraph>();

/** Builds still running, per locale, shared by every caller that arrives during one. */
const inflight = new Map<string, Promise<KeywordGraph>>();

/** Incremented on every clear, so a build started before it cannot repopulate the cache. */
let generation = 0;

/**
 * Drops the cached graph and abandons any build already running.
 *
 * @returns {void}
 */
const dropGraphs = (): void => {
  generation += 1;
  cache.clear();
  inflight.clear();
};

registerServerCache('keyword-graph', dropGraphs);

/**
 * Trims a route to the comparable form: no locale prefix, no trailing slash.
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
 * Reads every link record for a locale and folds it into a graph.
 *
 * @param {string} locale - Locale code
 * @param {number} startedAt - Generation the build began in
 * @returns {Promise<KeywordGraph>} The graph, cached when the generation still holds
 *
 * @description
 * The result is cached only when no clear happened while the read was in
 * flight; a build from a superseded generation is returned to its own callers
 * and then discarded.
 */
async function buildKeywordGraph(
  locale: string,
  startedAt: number,
): Promise<KeywordGraph> {
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

  if (generation === startedAt) cache.set(locale, graph);
  return graph;
}

/**
 * Builds the graph for a locale, reading every metadata record once.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<KeywordGraph>} The cached graph
 *
 * @description
 * Concurrent callers share one build. A page resolves every keyword it writes
 * in parallel, and the freshness check before the cache lookup yields, so
 * without this each reference would start its own full scan of the locale.
 */
export async function loadKeywordGraph(locale: string): Promise<KeywordGraph> {
  await ensureCachesFresh();

  const cached = cache.get(locale);
  if (cached) return cached;

  const pending = inflight.get(locale);
  if (pending) return pending;

  const build = buildKeywordGraph(locale, generation);
  inflight.set(locale, build);

  try {
    return await build;
  } finally {
    if (inflight.get(locale) === build) inflight.delete(locale);
  }
}

/**
 * The file that defines a shard, when exactly one does.
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
  dropGraphs();
}
