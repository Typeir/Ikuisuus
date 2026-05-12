/**
 * SWR Cache Key Builders
 *
 * @fileoverview Typed SWR cache key builder functions for every data resource
 * in the application. Each builder returns a `readonly` tuple that SWR uses as
 * the cache key, or `null` to opt out of fetching when the resource is
 * disabled. Co-locates the corresponding URL builders so callers never
 * construct API URLs by hand.
 *
 * @module lib/fetch/swrKeys
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Key tuples follow the convention `[resourceName, ...params]`.
 * All builder functions that accept an `enabled` parameter return `null` when
 * `enabled` is `false` or `undefined`, signalling SWR to skip the request.
 *
 * URL builders follow the convention `urlFor{Resource}(params)` and are used
 * exclusively by the hook fetcher closures, not by components.
 *
 * @example
 * // In a hook:
 * const key = bloodlinesKey(locale, editing);
 * const { data } = useSWR(key, () => fetcher(urlForBloodlines(locale)));
 */

/**
 * Builds the SWR cache key for the bloodlines index.
 *
 * @param {string} locale - Content locale
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['bloodlines', string] | null} Cache key or null
 */
export function bloodlinesKey(
  locale: string,
  enabled?: boolean,
): readonly ['bloodlines', string] | null {
  return enabled ? (['bloodlines', locale] as const) : null;
}

/**
 * Builds the SWR cache key for the vocations index.
 *
 * @param {string} locale - Content locale
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['vocations', string] | null} Cache key or null
 */
export function vocationsKey(
  locale: string,
  enabled?: boolean,
): readonly ['vocations', string] | null {
  return enabled ? (['vocations', locale] as const) : null;
}

/**
 * Builds the SWR cache key for the specializations index.
 *
 * @param {string} locale - Content locale
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['specializations', string] | null} Cache key or null
 */
export function specializationsKey(
  locale: string,
  enabled?: boolean,
): readonly ['specializations', string] | null {
  return enabled ? (['specializations', locale] as const) : null;
}

/**
 * Builds the SWR cache key for the feats index.
 *
 * @param {string} locale - Content locale
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['feats', string] | null} Cache key or null
 */
export function featsKey(
  locale: string,
  enabled?: boolean,
): readonly ['feats', string] | null {
  return enabled ? (['feats', locale] as const) : null;
}

/**
 * Builds the SWR cache key for the monsters metadata list.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['monsters', string]} Cache key
 */
export function monstersKey(locale: string): readonly ['monsters', string] {
  return ['monsters', locale] as const;
}

/**
 * Builds the SWR cache key for the heirlooms metadata list.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['heirlooms', string]} Cache key
 */
export function heirloomsKey(locale: string): readonly ['heirlooms', string] {
  return ['heirlooms', locale] as const;
}

/**
 * Builds the SWR cache key for the trinkets metadata list.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['trinkets', string]} Cache key
 */
export function trinketsKey(locale: string): readonly ['trinkets', string] {
  return ['trinkets', locale] as const;
}

/**
 * Builds the SWR cache key for the monster encounter index.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['monsters-index', string]} Cache key
 */
export function monstersIndexKey(
  locale: string,
): readonly ['monsters-index', string] {
  return ['monsters-index', locale] as const;
}

/**
 * Builds the SWR cache key for the spell encounter index.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['spells-index', string]} Cache key
 */
export function spellsIndexKey(
  locale: string,
): readonly ['spells-index', string] {
  return ['spells-index', locale] as const;
}

/**
 * Builds the SWR cache key for the affix encounter index.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['affixes-index', string]} Cache key
 */
export function affixesIndexKey(
  locale: string,
): readonly ['affixes-index', string] {
  return ['affixes-index', locale] as const;
}

/**
 * Builds the SWR cache key for a single spell detail.
 *
 * @param {string} slug - Spell slug
 * @param {string} locale - Content locale
 * @returns {readonly ['spell', string, string]} Cache key
 */
export function spellKey(
  slug: string,
  locale: string,
): readonly ['spell', string, string] {
  return ['spell', slug, locale] as const;
}

/**
 * Builds the SWR cache key for a library search query.
 *
 * @param {string} query - Search query string
 * @returns {readonly ['library-search', string] | null} Cache key or null for short queries
 */
export function librarySearchKey(
  query: string,
): readonly ['library-search', string] | null {
  return query.length >= 2 ? (['library-search', query] as const) : null;
}

/**
 * Builds the SWR cache key for an external web search query.
 *
 * @param {string} debouncedQuery - Debounced query (empty means skip)
 * @returns {readonly ['external-search', string] | null} Cache key or null
 */
export function externalSearchKey(
  debouncedQuery: string,
): readonly ['external-search', string] | null {
  return debouncedQuery.length >= 2
    ? (['external-search', debouncedQuery] as const)
    : null;
}

/**
 * Builds the SWR cache key for an active draft.
 *
 * @param {string} locale - Content locale
 * @param {string} slug - Content slug
 * @returns {readonly ['draft', string, string]} Cache key
 */
export function draftKey(
  locale: string,
  slug: string,
): readonly ['draft', string, string] {
  return ['draft', locale, slug] as const;
}

/**
 * Builds the SWR cache key for the corrections tree.
 *
 * @param {string} locale - Content locale
 * @returns {readonly ['corrections-tree', string]} Cache key
 */
export function correctionsTreeKey(
  locale: string,
): readonly ['corrections-tree', string] {
  return ['corrections-tree', locale] as const;
}

/**
 * Builds the SWR cache key for a nearest-route lookup.
 *
 * @param {string | null} pathname - Current pathname; null disables fetch
 * @returns {readonly ['nearest-route', string] | null} Cache key or null
 */
export function nearestRouteKey(
  pathname: string | null,
): readonly ['nearest-route', string] | null {
  return pathname ? (['nearest-route', pathname] as const) : null;
}

/**
 * Builds the SWR cache key for a shard heading fetch.
 *
 * @param {string} sourceFile - Source file slug
 * @param {string} heading - Heading within the file
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['shard', string, string] | null} Cache key or null
 */
export function shardKey(
  sourceFile: string,
  heading: string,
  enabled?: boolean,
): readonly ['shard', string, string] | null {
  return enabled ? (['shard', sourceFile, heading] as const) : null;
}

/**
 * Builds the SWR cache key for a content shard panel fetch.
 *
 * @param {string} contentType - API path segment (e.g. `'feats'`)
 * @param {string} slug - Content item slug
 * @param {string} locale - Content locale
 * @param {boolean} [enabled] - When falsy, returns null to skip fetch
 * @returns {readonly ['content-shard', string, string, string] | null} Cache key or null
 */
export function contentShardKey(
  contentType: string,
  slug: string,
  locale: string,
  enabled?: boolean,
): readonly ['content-shard', string, string, string] | null {
  return enabled
    ? (['content-shard', contentType, slug, locale] as const)
    : null;
}

/**
 * Builds the SWR cache key for a spell sources fetch.
 *
 * @param {string} sourcesHash - Stable JSON hash of sources + params
 * @param {string} locale - Content locale
 * @returns {readonly ['spell-sources', string, string]} Cache key
 */
export function spellSourcesKey(
  sourcesHash: string,
  locale: string,
): readonly ['spell-sources', string, string] {
  return ['spell-sources', sourcesHash, locale] as const;
}

/**
 * Builds the API URL for the bloodlines index.
 *
 * @param {string} locale - Content locale
 * @returns {string} API URL
 */
export function urlForBloodlines(locale: string): string {
  return `/api/bloodlines?locale=${locale}`;
}

/**
 * Builds the API URL for the vocations index.
 *
 * @param {string} locale - Content locale
 * @returns {string} API URL
 */
export function urlForVocations(locale: string): string {
  return `/api/vocations?locale=${locale}`;
}

/**
 * Builds the API URL for the specializations index.
 *
 * @param {string} locale - Content locale
 * @returns {string} API URL
 */
export function urlForSpecializations(locale: string): string {
  return `/api/specializations?locale=${locale}`;
}

/**
 * Builds the API URL for the feats index.
 *
 * @param {string} locale - Content locale
 * @returns {string} API URL
 */
export function urlForFeats(locale: string): string {
  return `/api/feats?locale=${locale}`;
}

/**
 * Builds the API URL for a content shard panel.
 *
 * @param {string} contentType - API path segment
 * @param {string} slug - Content item slug
 * @param {string} locale - Content locale
 * @returns {string} API URL
 */
export function urlForContentShard(
  contentType: string,
  slug: string,
  locale: string,
): string {
  return `/api/content-shards/${contentType}/${slug}?keys[]=main&locale=${locale}`;
}

/**
 * Builds the API URL for a shard heading fetch.
 *
 * @param {string} sourceFile - Source file slug
 * @param {string} heading - Heading within the file
 * @returns {string} API URL
 */
export function urlForShard(sourceFile: string, heading: string): string {
  const params = new URLSearchParams({ file: sourceFile, heading });
  return `/api/shards?${params.toString()}`;
}
