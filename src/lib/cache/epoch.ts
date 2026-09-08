/**
 * @fileoverview Cache Epoch Port
 * @description A shared, monotonically changing marker that every server
 * instance can read.
 *
 * @module lib/cache/epoch
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Source of the shared cache epoch.
 *
 * @interface CacheEpochSource
 */
export interface CacheEpochSource {
  /**
   * The current epoch value, or null when no shared store backs this
   * deployment.
   *
   * @returns {Promise<string | null>} Current epoch, or null when unsupported
   */
  current(): Promise<string | null>;

  /**
   * Advances the epoch, telling every instance its in-memory caches are
   * stale.
   *
   * @returns {Promise<void>} Resolves when the bump has been issued
   */
  bump(): Promise<void>;
}

/** Epoch source for deployments with no shared store. */
const noneEpochSource: CacheEpochSource = {
  current: async () => null,
  bump: async () => {},
};

/** @property {string} epochBackend - Active backend */
const epochBackend = process.env.CACHE_EPOCH_BACKEND || 'none';

/**
 * Resolves the epoch source for the active backend.
 *
 * @returns {CacheEpochSource} Epoch source
 * @throws {Error} If `CACHE_EPOCH_BACKEND` names an unknown backend
 */
const createCacheEpochSource = (): CacheEpochSource => {
  switch (epochBackend) {
    case 'none':
      return noneEpochSource;
    default:
      throw new Error(`Unsupported cache epoch backend: ${epochBackend}`);
  }
};

/** @property {CacheEpochSource} cacheEpochSource - Resolved instance. */
export const cacheEpochSource = createCacheEpochSource();
