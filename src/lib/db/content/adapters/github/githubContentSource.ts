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
 * @param {string} locale - Content locale
 * @param {string} relativeFilePath - File path relative to locale root including extension
 * @returns {Promise<ContentFetchResult | null>} Resolved content result or null
 */
const fetchConcreteFile = async (
  locale: string,
  relativeFilePath: string,
): Promise<ContentFetchResult | null> => {
  const url = `${GITHUB_RAW_BASE}/${locale}/${relativeFilePath}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
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
 * Fetches from `raw.githubusercontent.com` with no caching — ISR handles
 * page-level caching; the raw MDX must always be fresh.
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
      return null;
    }

    const filePath = relativeDirectory
      ? `${relativeDirectory}/${mdxFile.name}`
      : mdxFile.name;

    return fetchConcreteFile(locale, filePath);
  },
};
