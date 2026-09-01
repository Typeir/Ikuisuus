/**
 * @fileoverview File-Tree Service
 * @description Adapter-agnostic facade for paginated directory listings,
 * stat checks and file retrieval. Provides a small LRU in-memory cache with
 * TTL to reduce directory adapter pressure.
 * @module lib/db/content/fileTreeService
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import 'server-only';

import { cache } from 'react';

import {
    ensureCachesFresh,
    registerServerCache,
} from '@/lib/cache/registry';
import {
    FILE_EXT_MDX,
    IGNORED_FOLDERS,
    stripContentSuffix,
} from '@/lib/constants/content';

import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import type { ContentFetchResult } from './contentSourceAdapter';
import type {
    DirectoryEntry,
    DirectorySourceAdapter,
} from './directorySourceAdapter';
import { resolveDirectorySource } from './directorySourceResolver';

/**
 * Options for paginated directory listings.
 */
export interface ListDirectoryOptions {
  limit?: number;
  cursor?: string;
  page?: number;
  pageSize?: number;
  filter?: string;
  sort?: 'name' | 'type';
}

/**
 * Result returned by `listDirectory`.
 */
export interface ListDirectoryResult {
  entries: DirectoryEntry[];
  total: number;
  nextCursor?: string;
}

/**
 * Path stat result
 */
export interface StatResult {
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
}

/**
 * Simple LRU cache entry shape
 */
interface CacheEntry {
  key: string;
  value: DirectoryEntry[];
  ts: number;
}

/**
 * Very small LRU cache implementation using Map for ordering.
 */
class SimpleLru {
  private map = new Map<string, CacheEntry>();
  private capacity: number;
  private ttlMs: number;

  constructor(capacity = 1000, ttlMs = 300_000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  get(key: string): DirectoryEntry[] | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: DirectoryEntry[]) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { key, value, ts: Date.now() });
    while (this.map.size > this.capacity) {
      const first = this.map.keys().next().value as string;
      this.map.delete(first);
    }
  }

  clear() {
    this.map.clear();
  }
}

const DEFAULT_TTL = Number(process.env.CONTENT_TREE_CACHE_TTL_MS || 300000);
const DEFAULT_CAPACITY = Number(
  process.env.CONTENT_TREE_CACHE_MAX_ENTRIES || 1000,
);

const lru = new SimpleLru(DEFAULT_CAPACITY, DEFAULT_TTL);

/**
 * Encodes an offset as a stable cursor string.
 */
const encodeCursor = (offset: number): string =>
  Buffer.from(String(offset)).toString('base64');

/**
 * Decodes a cursor previously produced by `encodeCursor`.
 */
const decodeCursor = (cursor: string | undefined): number => {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const n = parseInt(decoded, 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
};

/**
 * Normalizes a relative path (removes leading/trailing slashes).
 */
const normalizeRelativePath = (p: string | undefined): string => {
  if (!p) return '';
  return p.replace(/^\/+/, '').replace(/\/+$/, '');
};

/**
 * Lists a directory's immediate children with optional pagination.
 *
 * @param {string} locale - Locale code (e.g. "en")
 * @param {string} relativePath - Path relative to locale root (e.g. "items/heirlooms")
 * @param {ListDirectoryOptions} opts - Pagination and filter options
 * @returns {Promise<ListDirectoryResult>} Paginated entries, total and nextCursor
 */
export const listDirectory = async (
  locale: string,
  relativePath = '',
  opts: ListDirectoryOptions = {},
): Promise<ListDirectoryResult> => {
  await ensureCachesFresh();

  const adapter: DirectorySourceAdapter = resolveDirectorySource();
  const normalized = normalizeRelativePath(relativePath);
  const cacheKey = `${locale}:${normalized}`;

  let entries = lru.get(cacheKey);
  if (!entries) {
    entries = await adapter.listEntries(locale, normalized);
    entries = entries
      .filter(
        (entry) =>
          !IGNORED_FOLDERS.some((rx) => rx.test(entry.name)) &&
          !entry.name.includes('.hidden.') &&
          (entry.isDirectory || entry.name.endsWith(FILE_EXT_MDX)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    lru.set(cacheKey, entries);
  }

  const filter = opts.filter?.toLowerCase();
  const filtered = filter
    ? entries.filter((e) => e.name.toLowerCase().includes(filter))
    : entries;

  const total = filtered.length;
  const limit = opts.limit ?? opts.pageSize ?? 1000;
  const offset = opts.cursor
    ? decodeCursor(opts.cursor)
    : opts.page && opts.pageSize
      ? (Math.max(1, opts.page) - 1) * opts.pageSize
      : 0;

  const slice = filtered.slice(offset, offset + limit);
  const nextCursor =
    offset + limit < total ? encodeCursor(offset + limit) : undefined;

  return { entries: slice, total, nextCursor };
};

/**
 * Attempts to fetch a file's raw content using the content adapter.
 * Accepts slug-like paths or filesystem-style paths and normalizes them.
 *
 * @param {string} locale - Locale code
 * @param {string} relativeFilePath - Path relative to locale or absolute repo path
 * @returns {Promise<ContentFetchResult | null>} Content and resolved path, or null
 */
export const getFile = cache(
  async (
    locale: string,
    relativeFilePath: string,
  ): Promise<ContentFetchResult | null> => {
    let p = relativeFilePath.replace(/^\/+/, '');
    const prefix = `src/content/${locale}/`;
    if (p.startsWith(prefix)) {
      p = p.slice(prefix.length);
    }

    p = p.replace(/\/(main)\.(md|mdx)$|\.(md|mdx)$/i, (_m, maybeMain) => {
      return maybeMain ? `/${maybeMain}` : '';
    }) as string;

    const parts = p.split('/');
    parts[parts.length - 1] = stripContentSuffix(parts[parts.length - 1]);
    const slugPath = parts.filter(Boolean).join('/');

    const result = await fetchContent(locale, slugPath);
    return result;
  },
);

/**
 * Lightweight stat implementation using the directory adapter.
 *
 * @param {string} locale - Locale code
 * @param {string} relativePath - Path to test
 * @returns {Promise<StatResult>} Existence and type flags
 */
export const statPath = async (
  locale: string,
  relativePath: string,
): Promise<StatResult> => {
  const adapter: DirectorySourceAdapter = resolveDirectorySource();
  const normalized = normalizeRelativePath(relativePath);
  const prefix = `src/content/${locale}/`;
  let p = normalized;
  if (p.startsWith(prefix)) p = p.slice(prefix.length);

  if (!p) return { exists: true, isFile: false, isDirectory: true };

  const parts = p.split('/');
  const name = parts.pop() as string;
  const parent = parts.join('/');
  const entries = await adapter.listEntries(locale, parent);
  const found = entries.find(
    (e) => e.name === name || e.name === `${name}${FILE_EXT_MDX}`,
  );
  if (found) {
    return {
      exists: true,
      isFile: !found.isDirectory,
      isDirectory: found.isDirectory,
    };
  }

  return { exists: false, isFile: false, isDirectory: false };
};

/**
 * Clears this module's listing LRU. Cross-cache invalidation goes through
 * `clearServerCaches` in the cache registry, which this is registered with.
 */
export const clearCache = (): void => {
  lru.clear();
};

registerServerCache('file-tree-lru', clearCache);

/** @type {{ listDirectory: typeof listDirectory; getFile: typeof getFile; statPath: typeof statPath; clearCache: typeof clearCache }} */
const fileTreeService = {
  listDirectory,
  getFile,
  statPath,
  clearCache,
};

export default fileTreeService;
