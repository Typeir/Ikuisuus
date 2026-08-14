/**
 * @fileoverview Content Fetcher
 * @description Resolves a ContentSourceAdapter (filesystem or GitHub) by
 * environment and delegates fetching through it. React `cache()` deduplicates
 * calls within one server request.
 *
 * @module lib/utils/fetchContent
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import { cache } from 'react';

import { fsContentSource } from '@/lib/db/content/adapters/fs/fsContentSource';
import { githubContentSource } from '@/lib/db/content/adapters/github/githubContentSource';
import type { ContentSourceAdapter } from '@/lib/db/content/contentSourceAdapter';

const log = logger.child({ module: 'ContentFetcher' });

/**
 * @function isBuildTime
 * @description Returns whether the filesystem adapter should be used.
 * `CONTENT_FETCH_MODE` overrides; otherwise reads `NODE_ENV` and
 * `NEXT_PHASE` (`phase-production-build`, `phase-development-server`).
 *
 * @returns {boolean} True during dev or build, false in production runtime
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
 * @description Returns the active ContentSourceAdapter: filesystem at build
 * time, GitHub at runtime.
 * @returns {ContentSourceAdapter} The resolved content source adapter
 */
const resolveContentSource = (): ContentSourceAdapter => {
  return isBuildTime() ? fsContentSource : githubContentSource;
};

/**
 * @function fetchContent
 * @description Fetches MDX content via the environment-appropriate adapter,
 * wrapped with React `cache()` to deduplicate calls in one server request.
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
    const result = await source.fetch(locale, slugPath);
    if (result && process.env.NODE_ENV === 'development') {
      log.debug('Fetched MDX content', {
        slugPath,
        resolvedPath: result.resolvedPath,
        content: result.content,
      });
    }
    return result;
  },
);
