/**
 * @fileoverview Cache Invalidator Port
 * @description The framework-facing half of invalidation: busting a tagged
 * Data Cache entry and re-rendering a route. Both are Next/Vercel semantics
 * today, so they live behind this port; a different deployment swaps the
 * adapter, not the routes that invalidate.
 *
 * @module lib/cache/invalidator
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Invalidates framework-managed caches.
 *
 * @interface CacheInvalidator
 */
export interface CacheInvalidator {
  /**
   * Busts every Data Cache entry registered under a tag.
   *
   * @param {string} tag - Cache tag, e.g. from `contentCacheTag`
   */
  invalidateTag(tag: string): void;

  /**
   * Re-renders a route on its next request.
   *
   * @param {string} path - Route path
   * @param {'page' | 'layout'} [type] - Segment type; the framework default when omitted
   */
  invalidateRoute(path: string, type?: 'page' | 'layout'): void;
}

/** Next.js-backed invalidator. */
const nextCacheInvalidator: CacheInvalidator = {
  invalidateTag(tag) {
    revalidateTag(tag, 'max');
  },
  invalidateRoute(path, type) {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  },
};

/** @property {CacheInvalidator} cacheInvalidator - Resolved instance. */
export const cacheInvalidator: CacheInvalidator = nextCacheInvalidator;
