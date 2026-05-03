/**
 * Directory Walker Utility
 *
 * @fileoverview Pure adapter-based recursive directory traversal for building
 * navigation trees. All functions accept a {@link DirectorySourceAdapter}
 * so this module has zero coupling to any concrete data source. Repository-
 * coupled wrappers ({@link repositoryWalk}, {@link repositoryShallowWalk})
 * live in `./repositoryWalk`.
 *
 * @module walk
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires ../db/content/directorySourceAdapter Adapter interface
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
 * - Shallow variant marks depth-limited directories with {@link WalkNode.isStub}
 *
 * @example
 * ```typescript
 * import { walk } from './walk';
 * import { fsDirectorySource } from '../db/content/adapters/fs/fsDirectorySource';
 *
 * const tree = await walk(fsDirectorySource, 'en', '', '');
 * // Returns: [{ name: 'Monsters', path: 'monsters', children: [...] }]
 * ```
 */

import type { DirectorySourceAdapter } from '../db/content/directorySourceAdapter';
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
 * @property {boolean} [isStub] - True when a directory hit the depth limit;
 *   children exist but have not been loaded yet
 * @property {number} [childCount] - Total descendant node count (set on stub nodes
 *   for pre-calculating expanded height before the children are fetched)
 * @property {string} [mainPath] - Kebab path to the `main.mdx` file if one exists
 *   in this directory (set on stub nodes so the folder link is navigable immediately)
 */
export interface WalkNode {
  /** Human-readable display name */
  name: string;
  /** URL-friendly kebab-case path segment */
  path: string;
  /** Child nodes (present only for directories) */
  children?: WalkNode[];
  /** True when this is a directory whose children have not yet been loaded */
  isStub?: boolean;
  /** Total descendant node count for height pre-calculation (stub nodes only) */
  childCount?: number;
  /** Kebab path to main.mdx if the directory contains one (stub nodes only) */
  mainPath?: string;
}

/**
 * Pure recursive tree builder. Accepts an explicit adapter so this function
 * can be used in tests or any context without coupling to a concrete data source.
 *
 * Use {@link repositoryWalk} from `./repositoryWalk` when you want automatic
 * adapter resolution from the environment.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source to list entries from
 * @param {string} locale - Locale code (e.g. "en", "es")
 * @param {string} relativePath - Path relative to the content root (e.g. "" or "monsters")
 * @param {string} base - Accumulated URL base path for child nodes
 * @returns {Promise<WalkNode[]>} Navigation tree nodes
 */
export const walk = async (
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
      const kebabPath = base ? `${base}/${kebabBase}` : kebabBase;

      if (entry.isDirectory) {
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
          children: await walk(adapter, locale, childRelativePath, kebabPath),
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

/**
 * Alias for {@link walk} for backward compatibility.
 * Prefer using {@link walk} directly.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter
 * @param {string} locale - Locale code
 * @param {string} relativePath - Relative path in the content root
 * @param {string} base - URL base prefix for child nodes
 * @returns {Promise<WalkNode[]>} Navigation tree nodes
 */
export const walkTree = walk;

/**
 * Default maximum depth for {@link shallowWalk}.
 * Depth 2 surfaces top-level categories (depth 1) and their immediate
 * sub-sections without recursing into deeply-nested content trees.
 *
 * @constant
 * @type {number}
 */
export const SHALLOW_WALK_DEPTH = 2;

/**
 * Pure adapter-based shallow tree builder.
 *
 * Recurses up to `maxDepth` levels. Directories at the depth limit are
 * returned with `{ children: [], isStub: true }` so the sidebar knows they
 * are expandable but must be lazy-loaded via an API call.
 *
 * Use {@link repositoryShallowWalk} from `./repositoryWalk` when you need
 * automatic adapter resolution backed by the LRU cache.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source to list entries from
 * @param {string} locale - Locale code (e.g. "en", "es")
 * @param {string} [relativePath=''] - Starting path relative to the content root
 * @param {string} [basePath=''] - URL base prefix inherited from the starting path
 * @param {number} [maxDepth=SHALLOW_WALK_DEPTH] - Maximum recursion depth
 * @returns {Promise<WalkNode[]>} Shallow navigation tree nodes
 *
 * @example
 * ```typescript
 * import { shallowWalk } from './walk';
 * import { fsDirectorySource } from '../db/content/adapters/fs/fsDirectorySource';
 *
 * const tree = await shallowWalk(fsDirectorySource, 'en');
 * // Returns top 2 levels; stub dirs have isStub: true, children: []
 * ```
 */
export const shallowWalk = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath = '',
  basePath = '',
  maxDepth = SHALLOW_WALK_DEPTH,
): Promise<WalkNode[]> => {
  return shallowWalkLevel(adapter, locale, relativePath, basePath, maxDepth, 0);
};

/**
 * Recursively counts all non-ignored file and directory nodes in a subtree.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter
 * @param {string} locale - Locale code
 * @param {string} relativePath - Path relative to the content root
 * @returns {Promise<number>} Total count of visible nodes in the subtree
 */
const countDescendants = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
): Promise<number> => {
  const rawEntries = await adapter.listEntries(locale, relativePath);
  const entries = rawEntries.filter(
    (e) =>
      !IGNORED_FOLDERS.some((r) => r.test(e.name)) &&
      !e.name.includes('.hidden.'),
  );

  const counts = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) {
        const childPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        return 1 + (await countDescendants(adapter, locale, childPath));
      }
      if (
        entry.name.endsWith(FILE_EXT_MD) ||
        entry.name.endsWith(FILE_EXT_MDX)
      ) {
        return 1;
      }
      return 0;
    }),
  );

  return counts.reduce((sum, n) => sum + n, 0);
};

/**
 * Checks whether a directory's immediate entries include a `main.mdx` or
 * `main.md` file and returns its kebab URL path.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter
 * @param {string} locale - Locale code
 * @param {string} relativePath - Path relative to the content root
 * @param {string} base - Kebab URL base path for the directory
 * @returns {Promise<string | undefined>} Kebab path to `main`, or `undefined`
 */
const detectMainPath = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  base: string,
): Promise<string | undefined> => {
  const rawEntries = await adapter.listEntries(locale, relativePath);
  const hasMain = rawEntries.some(
    (e) => !e.isDirectory && (e.name === 'main.mdx' || e.name === 'main.md'),
  );
  if (!hasMain) return undefined;
  return base ? `${base}/main` : 'main';
};

/**
 * Internal recursive helper for {@link shallowWalk}.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter
 * @param {string} locale - Locale code
 * @param {string} relativePath - Path relative to content root
 * @param {string} base - Accumulated URL-friendly base path for child nodes
 * @param {number} maxDepth - Maximum depth to recurse
 * @param {number} currentDepth - Current recursion depth
 * @returns {Promise<WalkNode[]>} Nodes for this level
 */
const shallowWalkLevel = async (
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  base: string,
  maxDepth: number,
  currentDepth: number,
): Promise<WalkNode[]> => {
  const rawEntries = await adapter.listEntries(locale, relativePath);

  const entries = rawEntries
    .filter(
      (e) =>
        !IGNORED_FOLDERS.some((r) => r.test(e.name)) &&
        !e.name.includes('.hidden.'),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter(
      (e) =>
        !e.isDirectory &&
        (e.name.endsWith(FILE_EXT_MD) || e.name.endsWith(FILE_EXT_MDX)),
    )
    .map((e) => e.name);

  const deduplicatedFiles = deduplicateFiles(files);

  const results = await Promise.all(
    entries.map(async (entry) => {
      const fileName = entry.name.replace(REGEX_EXTENSION, '');
      const suffixMatch = fileName.match(REGEX_CONTENT_SUFFIX);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      const baseFileName = suffix
        ? fileName.slice(0, -suffix.length)
        : fileName;
      const kebabBase = toKebabCase(baseFileName);
      const kebabPath = base ? `${base}/${kebabBase}` : kebabBase;

      if (entry.isDirectory) {
        if (currentDepth >= maxDepth - 1) {
          const childRelativePath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
          const [childCount, mainPath] = await Promise.all([
            countDescendants(adapter, locale, childRelativePath),
            detectMainPath(adapter, locale, childRelativePath, kebabPath),
          ]);
          return {
            name: toTitleCase(baseFileName),
            path: kebabPath,
            children: [] as WalkNode[],
            isStub: true,
            childCount,
            mainPath,
          };
        }
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
          children: await shallowWalkLevel(
            adapter,
            locale,
            childRelativePath,
            kebabPath,
            maxDepth,
            currentDepth + 1,
          ),
        };
      }

      if (
        entry.name.endsWith(FILE_EXT_MD) ||
        entry.name.endsWith(FILE_EXT_MDX)
      ) {
        if (!deduplicatedFiles.includes(entry.name)) return null;
        return { name: toTitleCase(baseFileName), path: kebabPath };
      }

      return null;
    }),
  );

  return results.filter(Boolean) as WalkNode[];
};
