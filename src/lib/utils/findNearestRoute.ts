/**
 * @fileoverview Nearest Route Finder - 404 Page Smart Redirect Utility
 * @description Finds the nearest matching route using Levenshtein distance algorithm
 * for intelligent 404 page suggestions. Scans content directory and calculates string
 * similarity to suggest the most likely intended destination.
 *
 * @module findNearestRoute
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs File system operations for scanning content
 * @requires path Path utilities for route resolution
 *
 * @example
 * // Find nearest route for misspelled URL
 * const match = await findNearestRoute('/library/spels/firebll');
 * // Returns: { path: '/library/spells/fireball', title: 'Fireball', similarity: 0.85 }
 */

import fs from 'fs';
import path from 'path';

import { REGEX_CONTENT_SUFFIX } from '@/lib/enums/constants';

/**
 * Route match result with similarity score
 *
 * @interface RouteMatch
 * @property {string} path - Full route path (e.g., '/library/spells/fireball')
 * @property {string} [title] - Human-readable title extracted from route
 * @property {number} similarity - Similarity score from 0 to 1 (1 = exact match)
 */
interface RouteMatch {
  path: string;
  title?: string;
  similarity: number;
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * @function levenshteinDistance
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Edit distance (number of insertions, deletions, or substitutions needed)
 *
 * @description Implements the Wagner-Fischer algorithm for computing edit distance.
 * Used as the foundation for similarity scoring between URLs.
 *
 * @example
 * levenshteinDistance('kitten', 'sitting'); // Returns: 3
 * levenshteinDistance('fireball', 'firebll'); // Returns: 1
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 *
 * @function calculateSimilarity
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score from 0 (no match) to 1 (exact match)
 *
 * @description Normalizes Levenshtein distance to a 0-1 scale based on the length
 * of the longer string. Case-insensitive comparison.
 *
 * @example
 * calculateSimilarity('fireball', 'fireball'); // Returns: 1.0
 * calculateSimilarity('fireball', 'firebll'); // Returns: 0.875
 * calculateSimilarity('foo', 'bar'); // Returns: 0.0
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Get all available routes from content directory
 *
 * @async
 * @function getAllRoutes
 * @returns {Promise<string[]>} Array of all valid route paths
 *
 * @description Recursively scans the English content directory (`src/content/en/`)
 * and builds an array of all available routes. Converts filesystem paths to URL routes.
 *
 * Conversion rules:
 * - `.mdx` files → `/library/{path}` (without extension)
 * - `.sheet.mdx` files → `/library/{path}` (removes `.sheet` suffix)
 * - `main.mdx` files → `/library/{directory}` (index routes)
 * - Subdirectories are preserved in route structure
 *
 * @example
 * // Returns array like:
 * [
 *   '/library/spells/fireball',
 *   '/library/monsters/ancient-red-dragon',
 *   '/library/items/heirlooms',
 *   ...
 * ]
 */
async function getAllRoutes(): Promise<string[]> {
  const routes: string[] = [];
  const contentDir = path.join(process.cwd(), 'src', 'content', 'en');

  /**
   * Recursively scan directory for MDX files and convert to routes
   *
   * @param {string} dir - Absolute directory path to scan
   * @param {string} [basePath=''] - Relative path from content root
   */
  function scanDirectory(dir: string, basePath: string = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const routePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath, routePath);
        } else if (entry.name.endsWith('.mdx') && entry.name !== 'main.mdx') {
          const slug = entry.name.replace(/\.(sheet\.)?mdx$/, '');
          const route =
            `/library/${routePath.replace(/\\/g, '/').replace(/\.mdx$/, '')}`.replace(
              /\.(sheet)?$/,
              '',
            );
          routes.push(route.replace(slug + '.mdx', slug));
        } else if (entry.name === 'main.mdx') {
          const route = `/library/${basePath.replace(/\\/g, '/')}/main`;
          routes.push(route);
        }
      }
    } catch (err) {}
  }

  scanDirectory(contentDir);
  return routes;
}

/**
 * Find the nearest matching route for a given pathname
 *
 * @param {string} pathname - The requested path that resulted in 404
 * @returns {Promise<RouteMatch|null>} Route match with similarity score, or null if no good match
 */
export async function findNearestRoute(
  pathname: string,
): Promise<RouteMatch | null> {
  const routes = await getAllRoutes();

  if (routes.length === 0) {
    return null;
  }

  /** Extract locale prefix from pathname for use in returned path */
  const localeMatch = pathname.match(/^\/(en|es|fi)/);
  const locale = localeMatch ? localeMatch[1] : 'en';

  /** Normalize pathname (remove locale prefix) for comparison */
  const normalizedPath = pathname.replace(/^\/(en|es|fi)/, '');

  /** Calculate similarity for each route */
  const matches = routes.map((route) => ({
    path: route,
    similarity: calculateSimilarity(normalizedPath, route),
  }));

  /** Sort by similarity (highest first) */
  matches.sort((a, b) => b.similarity - a.similarity);

  /** Return best match if similarity is above threshold (60%) */
  const bestMatch = matches[0];
  if (bestMatch && bestMatch.similarity >= 0.6) {
    /** Extract title from route's last segment, stripping semantic suffixes */
    const segments = bestMatch.path.split('/').filter(Boolean);
    const rawSegment = segments[segments.length - 1];
    const cleanSegment = (
      rawSegment === 'main' ? segments[segments.length - 2] : rawSegment
    )?.replace(REGEX_CONTENT_SUFFIX, '');
    const title = cleanSegment
      ?.split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    /** Prefix with locale so the link resolves correctly */
    const fullPath = `/${locale}${bestMatch.path}`;

    /** Prevent infinite loop: don't suggest the same path that 404'd */
    if (fullPath === pathname) {
      return null;
    }

    return {
      path: fullPath,
      title,
      similarity: bestMatch.similarity,
    };
  }

  return null;
}
