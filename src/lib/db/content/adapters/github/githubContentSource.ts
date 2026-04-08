/**
 * @fileoverview GitHub Raw Content Source Adapter
 * @description Implements the ContentSourceAdapter interface using GitHub's raw
 * content API. Used at production runtime to enable ISR revalidation — content
 * changes merged into the content repo are picked up without a full rebuild.
 *
 * Cache tags follow the format `content-{locale}-{slugPath}` so that the
 * revalidation API can bust the correct entry via `revalidateTag`.
 *
 * @module lib/db/content/adapters/github/githubContentSource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';

import { contentCacheTag } from '../../contentCacheTags';
import type {
  ContentFetchResult,
  ContentSourceAdapter,
} from '../../contentSourceAdapter';

const log = logger.child({ module: 'GitHubContentSource' });

/** @property {string} CONTENT_REPO_OWNER - GitHub repository owner */
const CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
/** @property {string} CONTENT_REPO_NAME - GitHub repository name */
const CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
/** @property {string} GITHUB_RAW_BASE - Base URL for raw content from the content repo */
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/main`;

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

/**
 * GitHub raw-content-backed content source.
 * Fetches from `raw.githubusercontent.com` with `force-cache` and
 * per-slug cache tags for targeted invalidation.
 */
export const githubContentSource: ContentSourceAdapter = {
  async fetch(
    locale: string,
    slugPath: string,
  ): Promise<ContentFetchResult | null> {
    for (const ext of EXTENSIONS) {
      const url = `${GITHUB_RAW_BASE}/${locale}/${slugPath}${ext}`;
      try {
        const res = await fetch(url, {
          cache: 'force-cache',
          next: { tags: [contentCacheTag(locale, slugPath)] },
        });
        if (res.ok) {
          const content = await res.text();
          const virtualPath = `${locale}/${slugPath}${ext}`;
          log.message('Fetched content from GitHub', { path: virtualPath });
          return { content, resolvedPath: virtualPath };
        }
      } catch (error) {
        log.warning('GitHub fetch failed for variant', {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  },
};
