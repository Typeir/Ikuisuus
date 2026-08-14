/**
 * @fileoverview Nearest-Route Service
 * @description API service helper for nearest-route suggestion lookups.
 *
 * @module lib/services/api/searchService
 * @author Typeir
 * @version 3.0.0
 * @since 2.0.0
 */

import { ApiRoutes } from '@/lib/enums/apiRoutes';
import { postJson } from './jsonClient';

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
