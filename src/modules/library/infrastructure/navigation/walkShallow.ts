/**
 * @fileoverview Depth-limited navigation walkers for lazy sidebar expansion.
 * @module modules/library/infrastructure/navigation/walkShallow
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import {
    FILE_EXT_MD,
    FILE_EXT_MDX,
    IGNORED_FOLDERS,
    REGEX_CONTENT_SUFFIX,
    REGEX_EXTENSION,
} from '@/lib/enums/constants';
import { deduplicateFiles } from '@/lib/utils/deduplicateFiles';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { toTitleCase } from '@/lib/utils/toTitleCase';
import type { WalkNode } from './types';

/** Default recursion depth for shallow walk operations. */
export const SHALLOW_WALK_DEPTH = 2;

/**
 * Renderable child count above which a directory is emitted as a stub even when
 * it sits below the depth cap.
 *
 * A flat directory such as `spells/` (393 entries) sits at depth 1 and would
 * otherwise expand inline, putting every leaf into the prerendered sidebar of
 * every page — once as DOM and once again in the serialized RSC payload, since
 * the tree crosses into a client component at the root layout. None of that
 * markup survives hydration: `SidebarItem` mounts children lazily and hands any
 * folder above `VIRTUALIZE_THRESHOLD` to the virtualized list, which renders a
 * window of rows rather than the full set.
 *
 * Kept equal to `VIRTUALIZE_THRESHOLD` so the rule reads as one statement: a
 * folder large enough to be virtualized on the client is never worth walking
 * into at build time.
 */
export const STUB_CHILD_THRESHOLD = 50;

/**
 * Builds a depth-limited navigation tree with stub nodes at the depth cap and
 * at any directory wider than {@link STUB_CHILD_THRESHOLD}.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} [relativePath=''] - Relative path from content root.
 * @param {string} [basePath=''] - URL path prefix.
 * @param {number} [maxDepth=SHALLOW_WALK_DEPTH] - Maximum depth.
 * @returns {Promise<WalkNode[]>} Shallow navigation nodes.
 */
export async function shallowWalk(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath = '',
  basePath = '',
  maxDepth = SHALLOW_WALK_DEPTH,
): Promise<WalkNode[]> {
  return shallowWalkLevel(adapter, locale, relativePath, basePath, maxDepth, 0);
}

/**
 * Counts all visible descendants for a directory path.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} relativePath - Relative path from content root.
 * @returns {Promise<number>} Descendant count.
 */
async function countDescendants(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
): Promise<number> {
  const entries = (await adapter.listEntries(locale, relativePath)).filter(
    (entry) =>
      !IGNORED_FOLDERS.some((pattern) => pattern.test(entry.name)) &&
      !entry.name.includes('.hidden.'),
  );

  const counts = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) {
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        return 1 + (await countDescendants(adapter, locale, childRelativePath));
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

  return counts.reduce((total, count) => total + count, 0);
}

/**
 * Counts the entries of a directory that the sidebar would render as rows:
 * its subdirectories plus its deduplicated markdown files.
 *
 * Distinct from {@link countDescendants}, which recurses; this looks one level
 * down only, because the stub decision is about how wide a single expansion is.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} relativePath - Relative path from content root.
 * @returns {Promise<number>} Immediate renderable child count.
 */
async function countRenderableChildren(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
): Promise<number> {
  const entries = (await adapter.listEntries(locale, relativePath)).filter(
    (entry) =>
      !IGNORED_FOLDERS.some((pattern) => pattern.test(entry.name)) &&
      !entry.name.includes('.hidden.'),
  );

  const directories = entries.filter((entry) => entry.isDirectory).length;
  const files = deduplicateFiles(
    entries
      .filter(
        (entry) =>
          !entry.isDirectory &&
          (entry.name.endsWith(FILE_EXT_MD) ||
            entry.name.endsWith(FILE_EXT_MDX)),
      )
      .map((entry) => entry.name),
  ).length;

  return directories + files;
}

/**
 * Detects whether a directory includes main content file and returns its route.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} relativePath - Relative path from content root.
 * @param {string} basePath - Kebab-case route path.
 * @returns {Promise<string | undefined>} Main route path when present.
 */
async function detectMainPath(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  basePath: string,
): Promise<string | undefined> {
  const entries = await adapter.listEntries(locale, relativePath);
  const hasMain = entries.some(
    (entry) =>
      !entry.isDirectory &&
      (entry.name === 'main.mdx' || entry.name === 'main.md'),
  );

  if (!hasMain) {
    return undefined;
  }

  return basePath ? `${basePath}/main` : 'main';
}

/**
 * Recursive implementation for depth-limited navigation walk.
 *
 * @param {DirectorySourceAdapter} adapter - Directory source adapter.
 * @param {string} locale - Locale code.
 * @param {string} relativePath - Relative path from content root.
 * @param {string} basePath - URL path prefix.
 * @param {number} maxDepth - Maximum recursion depth.
 * @param {number} currentDepth - Current recursion depth.
 * @returns {Promise<WalkNode[]>} Navigation nodes at current depth.
 */
async function shallowWalkLevel(
  adapter: DirectorySourceAdapter,
  locale: string,
  relativePath: string,
  basePath: string,
  maxDepth: number,
  currentDepth: number,
): Promise<WalkNode[]> {
  const entries = (await adapter.listEntries(locale, relativePath))
    .filter(
      (entry) =>
        !IGNORED_FOLDERS.some((pattern) => pattern.test(entry.name)) &&
        !entry.name.includes('.hidden.'),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const files = entries
    .filter(
      (entry) =>
        !entry.isDirectory &&
        (entry.name.endsWith(FILE_EXT_MD) || entry.name.endsWith(FILE_EXT_MDX)),
    )
    .map((entry) => entry.name);

  const deduplicatedFiles = deduplicateFiles(files);
  const nodes = await Promise.all(
    entries.map(async (entry) => {
      const fileName = entry.name.replace(REGEX_EXTENSION, '');
      const suffixMatch = fileName.match(REGEX_CONTENT_SUFFIX);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      const baseFileName = suffix
        ? fileName.slice(0, -suffix.length)
        : fileName;
      const kebabBase = toKebabCase(baseFileName);
      const kebabPath = basePath ? `${basePath}/${kebabBase}` : kebabBase;

      if (entry.isDirectory) {
        const childRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        const atDepthCap = currentDepth >= maxDepth - 1;
        const isWide =
          !atDepthCap &&
          (await countRenderableChildren(adapter, locale, childRelativePath)) >
            STUB_CHILD_THRESHOLD;

        if (atDepthCap || isWide) {
          const [childCount, mainPath] = await Promise.all([
            countDescendants(adapter, locale, childRelativePath),
            detectMainPath(adapter, locale, childRelativePath, kebabPath),
          ]);

          return {
            name: toTitleCase(baseFileName),
            path: kebabPath,
            children: [],
            isStub: true,
            childCount,
            mainPath,
          } satisfies WalkNode;
        }

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
        } satisfies WalkNode;
      }

      if (
        (entry.name.endsWith(FILE_EXT_MD) ||
          entry.name.endsWith(FILE_EXT_MDX)) &&
        deduplicatedFiles.includes(entry.name)
      ) {
        return {
          name: toTitleCase(baseFileName),
          path: kebabPath,
        } satisfies WalkNode;
      }

      return null;
    }),
  );

  return nodes.filter(Boolean) as WalkNode[];
}
