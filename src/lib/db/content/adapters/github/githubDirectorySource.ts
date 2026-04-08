/**
 * @fileoverview GitHub Directory Source Adapter
 * @description Implements the DirectorySourceAdapter interface using the GitHub
 * Git Trees API. Used at production runtime to enable ISR revalidation — directory
 * listings reflect the latest content structure without a full rebuild.
 *
 * Fetches the full recursive tree once and caches it in memory. Subsequent
 * listEntries calls filter the cached tree for O(n) lookups.
 *
 * @module lib/db/content/adapters/github/githubDirectorySource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';

import type {
    DirectoryEntry,
    DirectorySourceAdapter,
} from '../../directorySourceAdapter';

const log = logger.child({ module: 'GitHubDirectorySource' });

/**
 * Single entry from the GitHub Git Trees API response.
 *
 * @property {string} path - Full path relative to repo root
 * @property {string} type - "tree" for directories, "blob" for files
 */
interface GitTreeEntry {
  /** Full path relative to repo root */
  path: string;
  /** "tree" for directories, "blob" for files */
  type: string;
}

/** @property {string | undefined} CONTENT_REPO_OWNER - GitHub repository owner */
const CONTENT_REPO_OWNER = process.env.CONTENT_REPO_OWNER;
/** @property {string | undefined} CONTENT_REPO_NAME - GitHub repository name */
const CONTENT_REPO_NAME = process.env.CONTENT_REPO_NAME;
/** @property {string | undefined} GITHUB_PAT - GitHub Personal Access Token */
const GITHUB_PAT = process.env.GITHUB_PAT;
/** @property {string} CONTENT_REPO_BRANCH - Branch to read from */
const CONTENT_REPO_BRANCH = process.env.CONTENT_REPO_BRANCH || 'main';

/** @property {number} CACHE_TTL_MS - How long to cache the tree (5 minutes) */
const CACHE_TTL_MS = 300_000;

/** Cached tree promise with timestamp for TTL expiry */
let treeCache: { promise: Promise<GitTreeEntry[]>; timestamp: number } | null =
  null;

/**
 * Fetches the full recursive tree from the GitHub Git Trees API.
 *
 * @returns {Promise<GitTreeEntry[]>} Flat list of all tree entries
 */
async function fetchFullTree(): Promise<GitTreeEntry[]> {
  if (!CONTENT_REPO_OWNER || !CONTENT_REPO_NAME || !GITHUB_PAT) {
    log.warning(
      'Missing GitHub configuration (CONTENT_REPO_OWNER, CONTENT_REPO_NAME, GITHUB_PAT)',
    );
    return [];
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(CONTENT_REPO_OWNER)}/${encodeURIComponent(CONTENT_REPO_NAME)}/git/trees/${encodeURIComponent(CONTENT_REPO_BRANCH)}?recursive=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: 'application/vnd.github.v3+json',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text();
    log.error(`GitHub Trees API error ${res.status}: ${body}`);
    return [];
  }

  const data = await res.json();
  return (data.tree || []) as GitTreeEntry[];
}

/**
 * Returns the cached tree, refreshing if the TTL has expired.
 *
 * @returns {Promise<GitTreeEntry[]>} Flat list of all tree entries
 */
function getCachedTree(): Promise<GitTreeEntry[]> {
  if (treeCache && Date.now() - treeCache.timestamp < CACHE_TTL_MS) {
    return treeCache.promise;
  }
  const promise = fetchFullTree();
  treeCache = { promise, timestamp: Date.now() };
  return promise;
}

/**
 * GitHub-backed directory source.
 * Fetches the full repo tree once and filters entries per directory listing request.
 */
export const githubDirectorySource: DirectorySourceAdapter = {
  async listEntries(
    locale: string,
    relativePath: string,
  ): Promise<DirectoryEntry[]> {
    const tree = await getCachedTree();
    const prefix = relativePath ? `${locale}/${relativePath}/` : `${locale}/`;

    return tree
      .filter((entry) => {
        if (!entry.path.startsWith(prefix)) return false;
        const rest = entry.path.slice(prefix.length);
        return rest.length > 0 && !rest.includes('/');
      })
      .map((entry) => ({
        name: entry.path.slice(prefix.length),
        isDirectory: entry.type === 'tree',
      }));
  },
};
