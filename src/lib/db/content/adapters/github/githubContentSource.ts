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

import { CONTENT_SUFFIXES } from '@/lib/enums/constants';
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
/** @property {string} GITHUB_RAW_BASE - Base URL for raw content from the content repo */
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/main`;

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

/**
 * Resolves a single semantic-suffixed filename candidate for a base slug.
 *
 * @param {string[]} fileNames - File names from a single directory
 * @param {string} slugLeaf - Base slug segment without directory prefix
 * @returns {string | null} Unique semantic filename, or null when none/ambiguous
 */
const resolveUniqueSemanticFileName = (
  fileNames: string[],
  slugLeaf: string,
): string | null => {
  const candidates = fileNames.filter((fileName) => {
    const matchedExtension = EXTENSIONS.find((extension) =>
      fileName.endsWith(extension),
    );
    if (!matchedExtension) {
      return false;
    }

    const stem = fileName.slice(0, -matchedExtension.length);
    return CONTENT_SUFFIXES.some((suffix) => stem === `${slugLeaf}${suffix}`);
  });

  return candidates.length === 1 ? candidates[0] : null;
};

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
 * List the directory first and resolve the correct semantic filename.
 * Page-level caching; the raw MDX must always be fresh.
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
    const fileNames = entries
      .filter((entry) => !entry.isDirectory)
      .map((entry) => entry.name);
    const semanticFileName = resolveUniqueSemanticFileName(fileNames, slugLeaf);

    if (!semanticFileName) {
      return null;
    }

    const semanticPath = relativeDirectory
      ? `${relativeDirectory}/${semanticFileName}`
      : semanticFileName;

    return fetchConcreteFile(locale, semanticPath);
  },
};
