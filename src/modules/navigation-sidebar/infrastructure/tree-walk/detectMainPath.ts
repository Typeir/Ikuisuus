/**
 * @fileoverview Detects main.mdx files in navigation items and maps folder paths to their main.mdx paths.
 * @module modules/navigation-sidebar/infrastructure/tree-walk/detectMainPath
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Recursively detects main.mdx in directories and returns its path.
 * Maps each folder path to its main.mdx path.
 *
 * @param {Item[]} items - Navigation items
 * @param {string} [basePath=''] - Current path prefix
 * @returns {Map<string, string>} Map of folder path → main.mdx path
 */
export function detectMainPaths(
  items: Item[],
  basePath = '',
): Map<string, string> {
  const mainPaths = new Map<string, string>();

  for (const item of items) {
    const itemPath = basePath ? `${basePath}/${item.path}` : item.path;

    if (item.children && item.children.length > 0) {
      const hasMain = item.children.some(
        (child) => child.path === `${itemPath}/main`,
      );

      if (hasMain) {
        mainPaths.set(itemPath, `${itemPath}/main`);
      }

      const childPaths = detectMainPaths(item.children, itemPath);
      for (const [path, mainPath] of childPaths) {
        mainPaths.set(path, mainPath);
      }
    }
  }

  return mainPaths;
}

/**
 * Returns the main.mdx path for a single directory if present.
 *
 * @param {Item[]} items - Child items of the directory
 * @param {string} basePath - Current directory path
 * @returns {string | undefined} Path to main.mdx if present
 */
export function findMainPath(
  items: Item[],
  basePath: string,
): string | undefined {
  const mainItemPath = basePath ? `${basePath}/main` : 'main';
  const hasMain = items.some((item) => item.path === mainItemPath);

  if (hasMain) {
    return mainItemPath;
  }

  return undefined;
}
