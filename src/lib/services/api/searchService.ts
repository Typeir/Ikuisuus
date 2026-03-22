/**
 * @fileoverview Search Service
 * @description API service helpers for local library search, external search,
 * and nearest-route suggestion lookups.
 *
 * @module lib/services/api/searchService
 */

import { ApiRoutes } from '@/lib/enums/apiRoutes';
import { getJson, postJson } from './jsonClient';

/**
 * Local library search result entry.
 *
 * @interface SearchResult
 * @property {string} name - Display name
 * @property {string} path - Content path relative to library root
 */
export interface SearchResult {
  name: string;
  path: string;
}

/**
 * External web search result entry.
 *
 * @interface GoogleSearchResult
 * @property {string} title - External result title
 * @property {string} link - External result URL
 */
export interface GoogleSearchResult {
  title: string;
  link: string;
}

/**
 * Nearest-route match payload.
 *
 * @interface RouteMatch
 * @property {string} path - Matched route path
 * @property {string} [title] - Optional route title
 * @property {number} similarity - Similarity score between 0 and 1
 */
export interface RouteMatch {
  path: string;
  title?: string;
  similarity: number;
}

/**
 * Fetches local library search results for a query.
 *
 * @param {string} query - Search query string
 * @returns {Promise<SearchResult[]>} Local search results
 */
export function fetchLibrarySearchResults(
  query: string,
): Promise<SearchResult[]> {
  return getJson<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`);
}

/**
 * Fetches external web search results for a query.
 *
 * @param {string} query - Search query string
 * @returns {Promise<GoogleSearchResult[]>} External search results
 */
export async function fetchExternalSearchResults(
  query: string,
): Promise<GoogleSearchResult[]> {
  const payload = await getJson<
    GoogleSearchResult[] | { items?: GoogleSearchResult[] }
  >(`/api/web-search?q=${encodeURIComponent(query)}`);

  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.items ?? [];
}

/**
 * Finds nearest known route for a pathname.
 *
 * @param {string} pathname - Route pathname to match
 * @returns {Promise<RouteMatch | null>} Best match or null when not found
 */
export async function fetchNearestRoute(
  pathname: string,
): Promise<RouteMatch | null> {
  const payload = await postJson<
    { pathname: string },
    { match: RouteMatch | null }
  >(ApiRoutes.FindNearestRoute, { pathname });

  return payload.match;
}
