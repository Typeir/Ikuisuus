/**
 * Directory Walker Utility
 *
 * @fileoverview Adapter-based recursive directory traversal for building
 * navigation trees. Uses {@link DirectorySourceAdapter} so the same walk logic
 * works against the local filesystem (dev/build) or the GitHub Git Trees API
 * (production runtime).
 *
 * @module walk
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires ../db/content/directorySourceAdapter Adapter interface
 * @requires ../db/content/directorySourceResolver Adapter resolution factory
 * @requires ../enums/constants File patterns and ignored folders
 * @requires ./deduplicateFiles File deduplication utility
 * @requires ./toKebabCase String formatting utility
 * @requires ./toTitleCase String formatting utility
 *
 * @description
 * Builds navigation tree structure from content directories:
 * - Recursively traverses directory structure via adapter
 * - Converts filenames to kebab-case URL paths
 * - Handles double-extension suffixes (.sheet, .specialization, .list, etc.)
 * - Deduplicates files with same base name (prefers longer names)
 * - Filters out ignored directories and hidden files
 *
 * @example
 * ```typescript
 * const tree = await walk('en');
 * // Returns: [{ name: 'Monsters', path: 'monsters', children: [...] }]
 * ```
 */

import type { DirectorySourceAdapter } from '../db/content/directorySourceAdapter';
import { resolveDirectorySource } from '../db/content/directorySourceResolver';
import {
    FILE_EXT_MD,
    FILE_EXT_MDX,
    IGNORED_FOLDERS,
    REGEX_CONTENT_SUFFIX,
    REGEX_EXTENSION,
} from '../enums/constants';
import { deduplicateFiles } from './deduplicateFiles';
import { toKebabCase } from './toKebabCase';
import { toTitleCase } from './toTitleCase';

/**
 * A single node in the navigation tree returned by {@link walk}.
 *
 * @property {string} name - Human-readable display name (title-cased)
 * @property {string} path - URL-friendly kebab-case path segment
 * @property {WalkNode[]} [children] - Child nodes (present only for directories)
 */
export interface WalkNode {
  /** Human-readable display name */
  name: string;
  /** URL-friendly kebab-case path segment */
  path: string;
  /** Child nodes (present only for directories) */
  children?: WalkNode[];
}

/**
 * Builds a navigation tree for a locale's content directory.
 * Resolves the directory source adapter automatically based on the environment.
 *
 * @param {string} locale - Locale code (e.g. "en", "es")
 * @param {string} [base=''] - Base path prefix for URL construction (used internally for recursion)
 * @returns {Promise<WalkNode[]>} Navigation tree nodes
 */
export const walk = async (locale: string, base = ''): Promise<WalkNode[]> => {
  const adapter = resolveDirectorySource();
  return walkTree(adapter, locale, '', base);
};

/**
 * Recursive tree builder that accepts an explicit adapter.
 * Exported for testing — allows injecting a custom adapter (e.g. wrapping
 * a temporary directory for integration tests).
 *
 * @param {DirectorySourceAdapter} adapter - Directory source to list entries from
 * @param {string} locale - Locale code
 * @param {string} relativePath - Path relative to the content root (e.g. "" or "monsters")
 * @param {string} base - Accumulated URL base path for child nodes
 * @returns {Promise<WalkNode[]>} Navigation tree nodes
 */
export const walkTree = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  base: string,
): Promise<WalkNode[]> => {
  const entries = await adapter.listEntries(locale, relativePath);

  const filtered = entries
    .filter(
      (e) =>
        !IGNORED_FOLDERS.some((r) => r.test(e.name)) &&
        !e.name.includes('.hidden.'),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = filtered
    .filter(
      (e) =>
        !e.isDirectory &&
        (e.name.endsWith(FILE_EXT_MD) || e.name.endsWith(FILE_EXT_MDX)),
    )
    .map((e) => e.name);

  const deduplicatedFiles = deduplicateFiles(files);

  const results = await Promise.all(
    filtered.map(async (entry) => {
      const fileName = entry.name.replace(REGEX_EXTENSION, '');

      const suffixMatch = fileName.match(REGEX_CONTENT_SUFFIX);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      const baseFileName = suffix
        ? fileName.slice(0, -suffix.length)
        : fileName;
      const kebabBase = toKebabCase(baseFileName);
      const kebabFileName = suffix ? kebabBase + suffix : kebabBase;
      const kebabPath = base ? `${base}/${kebabFileName}` : kebabFileName;

      if (entry.isDirectory) {
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
          children: await walkTree(
            adapter,
            locale,
            childRelativePath,
            kebabPath,
          ),
        };
      }

      if (
        entry.name.endsWith(FILE_EXT_MD) ||
        entry.name.endsWith(FILE_EXT_MDX)
      ) {
        if (!deduplicatedFiles.includes(entry.name)) {
          return null;
        }
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
        };
      }

      return null;
    }),
  );

  return results.filter(Boolean) as WalkNode[];
};
