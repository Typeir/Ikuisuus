/**
 * @fileoverview Finds the closest existing library route for 404 recovery.
 * @module modules/library/application/use-cases/findNearestRoute
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import fs from 'fs';
import path from 'path';

import { MAIN_INDEX_FILE, REGEX_CONTENT_SUFFIX } from '@/lib/constants/content';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants/locales';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import { calculateSimilarity } from './findNearestRoute.levenshtein';
import { slugSegmentToTitle } from './buildLibraryMetadata';

const ROUTE_MATCH_THRESHOLD = 0.6;

/**
 * Nearest-route match payload.
 *
 * @interface RouteMatch
 * @property {string} path - Locale-prefixed route path.
 * @property {string} [title] - Human-readable title from route segment.
 * @property {number} similarity - Similarity score between 0 and 1.
 */
export interface RouteMatch {
  path: string;
  title?: string;
  similarity: number;
}

/**
 * Recursively scans a content directory and returns normalized library routes.
 *
 * @param {string} dir - Absolute directory path to scan.
 * @param {string} [basePath=''] - Relative route path accumulator.
 * @returns {string[]} Route paths without locale prefix.
 */
function collectRoutes(dir: string, basePath = ''): string[] {
  const routes: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const routePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        routes.push(...collectRoutes(fullPath, routePath));
        continue;
      }

      if (entry.name === MAIN_INDEX_FILE) {
        routes.push(`/library/${basePath.replace(/\\/g, '/')}/main`);
        continue;
      }

      if (entry.name.endsWith('.mdx')) {
        const slug = entry.name
          .replace(/\.mdx$/, '')
          .replace(REGEX_CONTENT_SUFFIX, '');
        routes.push(`/library/${basePath.replace(/\\/g, '/')}/${slug}`);
      }
    }
  } catch {
    return routes;
  }

  return routes;
}

/**
 * Returns every available route from English source content.
 *
 * @returns {string[]} Route paths without locale prefix.
 */
function getAllRoutes(): string[] {
  return collectRoutes(getContentFolder('en'));
}

/** Matches a single leading locale segment, derived from the locale list. */
const LEADING_LOCALE = new RegExp(`^\\/(${SUPPORTED_LOCALES.join('|')})`);

/**
 * Extracts locale from pathname.
 *
 * @param {string} pathname - Requested pathname.
 * @returns {string} Locale code or the default locale.
 */
function getLocale(pathname: string): string {
  const localeMatch = pathname.match(LEADING_LOCALE);
  return localeMatch ? localeMatch[1] : DEFAULT_LOCALE;
}

/**
 * Removes locale prefix before similarity comparison.
 *
 * @param {string} pathname - Requested pathname.
 * @returns {string} Path normalized for matching.
 */
function normalizePathname(pathname: string): string {
  return pathname.replace(LEADING_LOCALE, '');
}

/**
 * Builds a human-readable title from a route path segment.
 *
 * @param {string} routePath - Route path without locale prefix.
 * @returns {string | undefined} Titleized final segment.
 */
function buildTitle(routePath: string): string | undefined {
  const segments = routePath.split('/').filter(Boolean);
  const rawSegment = segments[segments.length - 1];
  const cleanSegment = (
    rawSegment === 'main' ? segments[segments.length - 2] : rawSegment
  )?.replace(REGEX_CONTENT_SUFFIX, '');

  if (!cleanSegment) {
    return undefined;
  }

  return slugSegmentToTitle(cleanSegment);
}

/**
 * Ranks every library route against a slug query, best first.
 *
 * Similarity is taken against the route's final content segment, falling back
 * to the full path when that scores higher, so `gobli` finds
 * `/library/monsters/goblin` without the caller knowing the folder.
 *
 * @param {string} query - Fuzzy slug or path fragment, e.g. `gobli`
 * @param {number} [limit] - Maximum matches returned (default 5)
 * @returns {RouteMatch[]} Ranked locale-less matches; empty when no routes exist
 */
export function findNearestFiles(query: string, limit = 5): RouteMatch[] {
  const routes = getAllRoutes();
  const normalized = query.trim().toLowerCase();
  if (!normalized || routes.length === 0) return [];

  return routes
    .map((route) => {
      const segments = route.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      const slugSegment =
        last === 'main' ? (segments[segments.length - 2] ?? last) : last;
      const similarity = Math.max(
        calculateSimilarity(normalized, slugSegment),
        calculateSimilarity(normalized, route),
      );
      return { path: route, title: buildTitle(route), similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Finds the nearest matching route for a pathname.
 *
 * @param {string} pathname - Original pathname that failed to resolve.
 * @returns {Promise<RouteMatch | null>} Best match over threshold, or null.
 */
export async function findNearestRoute(
  pathname: string,
): Promise<RouteMatch | null> {
  const routes = getAllRoutes();

  if (routes.length === 0) {
    return null;
  }

  const locale = getLocale(pathname);
  const normalizedPath = normalizePathname(pathname);
  const matches = routes
    .map((route) => ({
      path: route,
      similarity: calculateSimilarity(normalizedPath, route),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const bestMatch = matches[0];

  if (!bestMatch || bestMatch.similarity < ROUTE_MATCH_THRESHOLD) {
    return null;
  }

  const fullPath = `/${locale}${bestMatch.path}`;

  if (fullPath === pathname) {
    return null;
  }

  return {
    path: fullPath,
    title: buildTitle(bestMatch.path),
    similarity: bestMatch.similarity,
  };
}
