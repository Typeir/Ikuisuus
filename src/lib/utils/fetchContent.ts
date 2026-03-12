/**
 * @fileoverview Content Fetcher - Adapter-resolved content resolution
 * @description Resolves a ContentSourceAdapter (filesystem or GitHub) based on
 * the current environment and delegates all fetching through it. React `cache()`
 * deduplicates calls within a single server request (e.g. generateMetadata + Page).
 *
 * @module lib/utils/fetchContent
 */

import { logger } from '@/lib/logging/logger';
import { cache } from 'react';

import type { ContentSourceAdapter } from '@/lib/db/content/contentSourceAdapter';
import { fsContentSource } from '@/lib/db/content/adapters/fs/fsContentSource';
import { githubContentSource } from '@/lib/db/content/adapters/github/githubContentSource';

const log = logger.child({ module: 'ContentFetcher' });

/**
 * @function isBuildTime
 * @description
 * Determines whether we should prefer filesystem fetching.
 *
 * Use the filesystem during development and build phases so local content is
 * used for `next dev` and `next build` operations. At runtime (production
 * server) we prefer the GitHub remote fetch to allow ISR updates from the
 * content repo.
 *
 * Relies on `process.env.NEXT_PHASE` values emitted by Next.js:
 *  - `phase-development-server` (dev)
 *  - `phase-production-build` (build)
 *
 * @returns {boolean} True when running dev or build, false in production runtime
 */
const isBuildTime = (): boolean => {
  if (process.env.CONTENT_FETCH_MODE === 'build') return true;
  if (process.env.CONTENT_FETCH_MODE === 'runtime') return false;

  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  const phase = process.env.NEXT_PHASE;
  return (
    phase === 'phase-production-build' || phase === 'phase-development-server'
  );
};

/**
 * @function resolveContentSource
 * @description Factory that returns the active ContentSourceAdapter based on
 * the current environment (filesystem at build time, GitHub at runtime).
 * @returns {ContentSourceAdapter} The resolved content source adapter
 */
const resolveContentSource = (): ContentSourceAdapter => {
  return isBuildTime() ? fsContentSource : githubContentSource;
};

/**
 * @function fetchContent
 * @description
 * Fetches MDX content using the environment-appropriate adapter.
 * Wrapped with React `cache()` to deduplicate calls within a single
 * server request (generateMetadata and Page both call this).
 *
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and path, or null
 */
export const fetchContent = cache(
  async (
    locale: string,
    slugPath: string,
  ): Promise<{ content: string; resolvedPath: string } | null> => {
    const source = resolveContentSource();
    log.message('Fetching content', {
      slugPath,
      adapter: isBuildTime() ? 'fs' : 'github',
    });
    return source.fetch(locale, slugPath);
  },
);
