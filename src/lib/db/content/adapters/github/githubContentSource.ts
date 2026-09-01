/**
 * @fileoverview GitHub Raw Content Source Adapter
 * @description Implements ContentSourceAdapter using GitHub's raw content API.
 * Cache tags follow the format `content-{locale}-{slugPath}` for revalidation.
 *
 * @module lib/db/content/adapters/github/githubContentSource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import path from 'path';

import { resolveIndexFile } from '@/lib/constants/content';
import { contentCacheTag } from '../../contentCacheTags';
import type {
  ContentFetchResult,
  ContentSourceAdapter,
} from '../../contentSourceAdapter';
import { githubDirectorySource } from './githubDirectorySource';

const log = logger.child({ module: 'GitHubContentSource' });

/** @property {string} CONTENT_REPO_OWNER - GitHub repository owner */
const CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
/** @property {string} CONTENT_REPO_NAME - GitHub repository name */
const CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
/** @property {string} CONTENT_REPO_BRANCH - Branch to read from; defaults to `main` */
const CONTENT_REPO_BRANCH = process.env.CONTENT_REPO_BRANCH || 'main';
/** @property {string} GITHUB_RAW_BASE - Base URL for raw content from the content repo */
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/${CONTENT_REPO_BRANCH}`;

/**
 * Fetches a concrete file path from GitHub raw content.
 *
 * The response enters the Next.js Data Cache under `tag`, so the entry lives
 * until `/api/revalidate` busts that tag — never on a timer. A TTL here would
 * let a revalidated route re-render against stale prose.
 *
 * @param {string} locale - Content locale
 * @param {string} relativeFilePath - File path relative to locale root including extension
 * @param {string} tag - Data Cache tag, from `contentCacheTag`
 * @returns {Promise<ContentFetchResult | null>} Resolved content result or null
 */
const fetchConcreteFile = async (
  locale: string,
  relativeFilePath: string,
  tag: string,
): Promise<ContentFetchResult | null> => {
  const url = `${GITHUB_RAW_BASE}/${locale}/${relativeFilePath}`;

  try {
    const res = await fetch(url, {
      cache: 'force-cache',
      next: { tags: [tag] },
    });

    if (!res.ok) {
      return null;
    }

    const content = await res.text();
    const virtualPath = `${locale}/${relativeFilePath}`;
    log.message('Fetched content from GitHub', { path: virtualPath });
    return { content, resolvedPath: virtualPath };
  } catch (error) {
    log.warning('GitHub fetch failed for variant', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * GitHub raw-content-backed content source.
 * Fetches from `raw.githubusercontent.com` into the Data Cache, tagged
 * `contentCacheTag(locale, slugPath)` so `/api/revalidate` busts the file
 * entry and the routes it renders into on the same event.
 */
export const githubContentSource: ContentSourceAdapter = {
  async fetch(
    locale: string,
    slugPath: string,
  ): Promise<ContentFetchResult | null> {
    const slugDirectory = path.posix.dirname(slugPath);
    const relativeDirectory = slugDirectory === '.' ? '' : slugDirectory;
    const slugLeaf = path.posix.basename(slugPath);
    const entries = await githubDirectorySource.listEntries(
      locale,
      relativeDirectory,
    );
    const mdxFile = entries
      .filter((entry) => !entry.isDirectory && entry.name.endsWith('.mdx'))
      .find(
        (entry) =>
          entry.name === `${slugLeaf}.mdx` ||
          entry.name.startsWith(`${slugLeaf}.`),
      );

    if (!mdxFile) {
      const isFolder = entries.some(
        (entry) => entry.isDirectory && entry.name === slugLeaf,
      );
      if (!isFolder) {
        return null;
      }

      const folderEntries = await githubDirectorySource.listEntries(
        locale,
        slugPath,
      );
      const indexFile = resolveIndexFile(
        folderEntries.filter((entry) => !entry.isDirectory).map((e) => e.name),
        slugLeaf,
      );

      return indexFile
        ? fetchConcreteFile(
            locale,
            `${slugPath}/${indexFile}`,
            contentCacheTag(locale, slugPath),
          )
        : null;
    }

    const filePath = relativeDirectory
      ? `${relativeDirectory}/${mdxFile.name}`
      : mdxFile.name;

    return fetchConcreteFile(locale, filePath, contentCacheTag(locale, slugPath));
  },
};
