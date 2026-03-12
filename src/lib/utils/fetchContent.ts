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

/** @property {string} GITHUB_RAW_BASE - Base URL for raw content from the content repo */
const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/Typeir/ikuisuus-content/main';

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

/**
 * Determines whether the current execution context is a build-time render.
 *
 * @returns {boolean} True during `next build`, false at runtime
 */
const isBuildTime = (): boolean => {
  return process.env.NEXT_PHASE === 'phase-production-build';
};

/**
 * Fetches content from the local filesystem (used during build).
 *
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
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
 * Fetches content from GitHub's raw content API (used at runtime for ISR).
 *
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and virtual path, or null
 */
const fetchFromGitHub = async (
  locale: string,
  slugPath: string,
): Promise<{ content: string; resolvedPath: string } | null> => {
  for (const ext of EXTENSIONS) {
    const url = `${GITHUB_RAW_BASE}/${locale}/${slugPath}${ext}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
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
 * Fetches MDX content using filesystem at build time and GitHub API at runtime.
 * This enables ISR revalidation to pick up content changes from the repo
 * without requiring a full rebuild.
 *
 * @param {string} locale - Content locale (e.g. "en")
 * @param {string} slugPath - Slash-separated content path (e.g. "monsters/albedo")
 * @returns {Promise<{ content: string; resolvedPath: string } | null>} Content and path, or null
 */
export const fetchContent = async (
  locale: string,
  slugPath: string,
): Promise<{ content: string; resolvedPath: string } | null> => {
  const buildTime = isBuildTime();
  if (buildTime) {
    log.message('Using filesystem for content fetch', { slugPath });
    return fetchFromFilesystem(locale, slugPath);
  }
  log.message('Using GitHub for content fetch', { slugPath });
  return fetchFromGitHub(locale, slugPath);
};
