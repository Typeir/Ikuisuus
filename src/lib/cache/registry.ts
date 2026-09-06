/**
 * @fileoverview Server Cache Registry
 * @description Every module-level server cache registers its clear function
 * here at creation, so invalidation is one call over a known set rather than
 * a list of imports someone has to remember to extend.
 *
 * @module lib/cache/registry
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import { cacheEpochSource } from './epoch';

const log = logger.child({ module: 'ServerCacheRegistry' });

/** Registered clear functions, by cache name. */
const caches = new Map<string, () => void>();

/** Epoch the caches were last known fresh at; undefined until first read. */
let seenEpoch: string | null | undefined;

/**
 * Registers a module-level cache's clear function.
 *
 * @param {string} name - Stable cache name, e.g. `github-tree`
 * @param {() => void} clear - Drops the cache's state, synchronously
 *
 * @example
 * registerServerCache('keyword-graph', () => cache.clear());
 */
export function registerServerCache(name: string, clear: () => void): void {
  caches.set(name, clear);
}

/**
 * Clears every registered cache.
 */
export function clearServerCaches(): void {
  for (const [name, clear] of caches) {
    try {
      clear();
    } catch (error) {
      log.warning('Server cache failed to clear', {
        cache: name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Drops every registered cache when the shared epoch has moved since the
 * last check.
 *
 * @returns {Promise<void>} Resolves once freshness is settled
 */
export async function ensureCachesFresh(): Promise<void> {
  let epoch: string | null;
  try {
    epoch = await cacheEpochSource.current();
  } catch (error) {
    log.warning('Epoch read failed; keeping caches', {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (epoch === null) return;

  if (seenEpoch === undefined) {
    seenEpoch = epoch;
    return;
  }

  if (epoch !== seenEpoch) {
    seenEpoch = epoch;
    clearServerCaches();
  }
}
