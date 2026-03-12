/**
 * @fileoverview Content Fetcher - Dual-source content resolution
 * @description Fetches MDX content from GitHub's raw content API at runtime (ISR),
 * falling back to the local filesystem during build. This enables on-demand
 * revalidation to pick up content changes without a full rebuild.
 *
 * @module lib/utils/fetchContent
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

const log = logger.child({ module: 'ContentFetcher' });

/** @property {string} CONTENT_REPO_OWNER - GitHub repository owner */
const CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
/** @property {string} CONTENT_REPO_NAME - GitHub repository name */
const CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
/** @property {string} GITHUB_RAW_BASE - Base URL for raw content from the content repo */
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${CONTENT_REPO_OWNER}/${CONTENT_REPO_NAME}/main`;

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

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
  // Prefer an explicit build marker when available (set in next.config.js)
  if (process.env.CONTENT_FETCH_MODE === 'build') return true;

  if (process.env.CONTENT_FETCH_MODE === 'runtime') return false;

  if (process.env.NODE_ENV === 'development') {
    return false; // In production runtime, prefer GitHub
  }
  const phase = process.env.NEXT_PHASE;
  return (
    phase === 'phase-production-build' || phase === 'phase-development-server'
  );
};

/**
 * @function fetchContent
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * @description
 * Fetches content from the local filesystem (used during build).
 *
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and resolved path, or null
 */
const fetchFromFilesystem = async (
  locale: string,
  slugPath: string,
): Promise<{ content: string; resolvedPath: string } | null> => {
  const rootDir = path.join(process.cwd(), 'src', 'content', locale);

  for (const ext of EXTENSIONS) {
    const fullPath = path.join(rootDir, `${slugPath}${ext}`);
    try {
      await fs.access(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      return { content, resolvedPath: fullPath };
    } catch {
      continue;
    }
  }

  return null;
};

/**
 * @function fetchFromGitHub
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * @description
 * Fetches content from GitHub's raw content API (used at runtime for ISR).
 *
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and virtual path, or null
 * @todo Migrate GitHub integration to the project standard adapter pattern.
 * This function currently fetches content directly from GitHub using hardcoded URLs.
 * Refactor to use the adapter pattern for better modularity and testability.
 */
const fetchFromGitHub = async (
  locale: string,
  slugPath: string,
): Promise<{ content: string; resolvedPath: string } | null> => {
  for (const ext of EXTENSIONS) {
    const url = `${GITHUB_RAW_BASE}/${locale}/${slugPath}${ext}`;
    try {
      const res = await fetch(url, {
        cache: 'force-cache',
        next: { tags: [`content-${locale}-${slugPath}`] },
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
};

/**
 * @function fetchContent
 * @description
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * Fetches MDX content using filesystem at build time and GitHub API at runtime.
 * This enables ISR revalidation to pick up content changes from the repo
 * without requiring a full rebuild.
 *
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and path, or null
 */
export const fetchContent = async (
  locale: string,
  slugPath: string,
): Promise<{ content: string; resolvedPath: string } | null> => {
  const buildTime = isBuildTime();
  if (buildTime) {
    log.message('Using filesystem for content fetch', { slugPath });
    return await fetchFromFilesystem(locale, slugPath);
  }
  log.message('Using GitHub for content fetch', { slugPath });
  return await fetchFromGitHub(locale, slugPath);
};
