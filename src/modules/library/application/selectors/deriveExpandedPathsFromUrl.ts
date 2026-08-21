/**
 * Derives sidebar expansion paths from the current URL route
 *
 * @fileoverview Utility to expand sidebar ancestors based on the active route.
 * Provides deterministic baseline expansion for static pages.
 *
 * @module lib/utils/deriveExpandedPathsFromUrl
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { stripContentSuffix } from '@/lib/enums/constants';

/**
 * Derives which sidebar paths should be expanded based on the current URL
 *
 * @function deriveExpandedPathsFromUrl
 * @returns {string[]} Array of paths that should be expanded
 *
 * @description
 * Expands all ancestor folders of the current document in the navigation tree.
 * For example, if the URL is /en/library/monsters/ancient-red-dragon,
 * it will expand: ['/monsters', '/monsters/ancient-red-dragon']
 *
 * This provides a deterministic baseline for static pages where no
 * persisted state exists.
 *
 * @example
 * // URL: /en/library/monsters/dragons/ancient-red-dragon
 * const expanded = deriveExpandedPathsFromUrl();
 * // Returns: ['monsters', 'monsters/dragons', 'monsters/dragons/ancient-red-dragon']
 */
export function deriveExpandedPathsFromUrl(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const path = window.location.pathname;

  const match = path.match(/^\/[^/]+\/library\/(.+)$/);
  if (!match) {
    return [];
  }

  const contentPath = match[1];

  const normalizedPath = stripContentSuffix(contentPath);

  const segments = normalizedPath.split('/');
  const expandedPaths: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const ancestorPath = segments.slice(0, i + 1).join('/');
    expandedPaths.push(ancestorPath);
  }

  return expandedPaths;
}
