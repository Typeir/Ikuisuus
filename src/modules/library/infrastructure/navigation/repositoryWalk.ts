/**
 * Repository Walk Utilities
 *
 * @fileoverview Wraps {@link walk} and {@link shallowWalk} with the
 * {@link DirectorySourceAdapter} resolved from the runtime environment. The
 * shallow variant uses the LRU-cached {@link listDirectory} facade.
 *
 * @module modules/library/infrastructure/navigation/repositoryWalk
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires ./walk Pure walk utilities
 * @requires ../db/content/directorySourceResolver Environment adapter factory
 * @requires ../db/content/fileTreeService LRU-cached directory facade
 * @requires ../db/content/directorySourceAdapter Adapter interface
 *
 * @description
 * - `walk.ts` — pure traversal, no external service dependencies
 * - `repositoryWalk.ts` — wires up concrete adapters from the running environment
 *
 * @example
 * ```typescript
 * // Full recursive walk for build-time or server-rendered trees
 * const tree = await repositoryWalk('en');
 *
 * // Depth-limited walk for the initial SSR sidebar (benefits from LRU cache)
 * const shallowTree = await repositoryShallowWalk('en');
 *
 * // Fetch immediate children of a specific path for lazy sidebar expansion
 * const children = await repositoryShallowWalk('en', 'character-creation/vocations', 1);
 * ```
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import { resolveDirectorySource } from '@/lib/db/content/directorySourceResolver';
import { listDirectory } from '@/lib/db/content/fileTreeService';
import type { WalkNode } from './types';
import { walk } from './walkFull';
import { SHALLOW_WALK_DEPTH, shallowWalk } from './walkShallow';

/**
 * Builds an adapter that wraps the LRU-cached `listDirectory` for
 * {@link shallowWalk}. Ignores the `locale` argument forwarded by the walk
 * engine; the locale is captured in closure from {@link repositoryShallowWalk}.
 *
 * @param {string} locale - Locale code captured from the calling context
 * @returns {DirectorySourceAdapter} Adapter backed by the cached `listDirectory`
 */
const makeFileTreeAdapter = (locale: string): DirectorySourceAdapter => ({
  /**
   * Lists directory entries via the LRU-cached `listDirectory` service.
   *
   * @param {string} _locale - Locale forwarded by walk engine (ignored; locale is in closure)
   * @param {string} relativePath - Path relative to the content root
   * @returns {Promise<import('../db/content/directorySourceAdapter').DirectoryEntry[]>} Entries
   */
  async listEntries(_locale: string, relativePath: string) {
    const { entries } = await listDirectory(locale, relativePath, {
      limit: 10000,
    });
    return entries;
  },
});

/**
 * Full recursive navigation tree walk.
 *
 * Resolves the {@link DirectorySourceAdapter} for the current environment
 * (filesystem during dev/build, GitHub API in production) and runs
 * {@link walk}.
 *
 * @param {string} locale - Locale code (e.g. "en", "es")
 * @param {string} [base=''] - URL base prefix for path construction
 * @returns {Promise<WalkNode[]>} Complete navigation tree
 */
export const repositoryWalk = async (
  locale: string,
  base = '',
): Promise<WalkNode[]> => {
  const adapter = resolveDirectorySource();
  return walk(adapter, locale, '', base);
};

/**
 * Shallow navigation tree walk backed by the LRU-cached `listDirectory`.
 *
 * Recurses to `maxDepth` levels. Directories at the limit are returned as
 * stub nodes (`{ isStub: true, children: [] }`), lazy-loaded on demand via
 * the `/api/content/walk` route.
 *
 * `maxDepth = 1` returns only the immediate children of `relativePath`; all
 * subdirectories are stubs. Used by `/api/content/walk` for folder expansion.
 *
 * @param {string} locale - Locale code (e.g. "en", "es")
 * @param {string} [relativePath=''] - Starting path relative to the content root
 * @param {number} [maxDepth=SHALLOW_WALK_DEPTH] - Maximum recursion depth
 * @returns {Promise<WalkNode[]>} Shallow navigation tree nodes
 */
export const repositoryShallowWalk = async (
  locale: string,
  relativePath = '',
  maxDepth = SHALLOW_WALK_DEPTH,
): Promise<WalkNode[]> => {
  const adapter = makeFileTreeAdapter(locale);
  return shallowWalk(adapter, locale, relativePath, relativePath, maxDepth);
};
