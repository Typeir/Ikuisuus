/**
 * @fileoverview Content Tree Service
 * @description Provides adapter-driven content tree traversal for consumers
 * that need folder/file hierarchies from locale content roots.
 *
 * @module lib/db/content/contentTreeService
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { FILE_EXT_MDX, IGNORED_FOLDERS } from '@/lib/enums/constants';

import type { DirectorySourceAdapter } from './directorySourceAdapter';
import { resolveDirectorySource } from './directorySourceResolver';

/**
 * Tree node representing a folder or file in a locale content tree.
 *
 * @property {string} name - Display name
 * @property {string} path - Full locale-relative path (`locale/segment/...`)
 * @property {ContentTreeNode[]} children - Nested children (empty for files)
 * @property {boolean} [isFile] - True when node represents a file
 */
export interface ContentTreeNode {
  /** Display name */
  name: string;
  /** Full locale-relative path */
  path: string;
  /** Nested children */
  children: ContentTreeNode[];
  /** True when node represents a file */
  isFile?: boolean;
}

/**
 * Builds a nested tree by recursively traversing a directory source adapter.
 *
 * @param {DirectorySourceAdapter} adapter - Active directory source adapter
 * @param {string} locale - Locale code
 * @param {string} [relativePath=''] - Path relative to locale root
 * @returns {Promise<ContentTreeNode[]>} Nested content tree
 */
export const buildContentTree = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath = '',
): Promise<ContentTreeNode[]> => {
  const entries = await adapter.listEntries(locale, relativePath);

  const filtered = entries
    .filter(
      (entry) =>
        !IGNORED_FOLDERS.some((pattern) => pattern.test(entry.name)) &&
        !entry.name.includes('.hidden.') &&
        (entry.isDirectory || entry.name.endsWith(FILE_EXT_MDX)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const nodes = await Promise.all(
    filtered.map(async (entry) => {
      const childRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const fullPath = `${locale}/${childRelativePath}`;

      if (entry.isDirectory) {
        return {
          name: entry.name,
          path: fullPath,
          children: await buildContentTree(adapter, locale, childRelativePath),
        } satisfies ContentTreeNode;
      }

      return {
        name: entry.name,
        path: fullPath,
        children: [],
        isFile: true,
      } satisfies ContentTreeNode;
    }),
  );

  return nodes;
};

/**
 * Returns content tree for a locale using the environment-resolved directory source.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<ContentTreeNode[]>} Nested content tree
 */
export const listContentTree = async (
  locale: string,
): Promise<ContentTreeNode[]> => {
  const adapter = resolveDirectorySource();
  return buildContentTree(adapter, locale);
};
