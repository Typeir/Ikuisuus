/**
 * Content Search Utility
 *
 * @fileoverview Filename-based search for MDX content files in the library.
 * Walks content directories recursively and returns matching files with URL-friendly paths.
 *
 * @module search
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path module
 * @requires ./getContentFolder Locale-aware content directory resolver
 *
 * @description
 * Provides filesystem-based content search for the library:
 * - Recursively walks content directories
 * - Matches filenames against query (case-insensitive)
 * - Returns kebab-case paths suitable for URLs
 * - Ignores infrastructure directories (.git, node_modules, etc.)
 *
 * @example
 * ```typescript
 * const results = await searchContent('dragon');
 * // Returns: [{ name: 'Ancient Dragon', path: 'monsters/ancient-dragon' }]
 * ```
 */

import fs from 'fs';
import path from 'path';
import { IGNORED_FOLDERS, REGEX_CONTENT_SUFFIX } from '../enums/constants';
import { getContentFolder } from './getContentFolder';

/**
 * Converts a string to kebab-case format.
 * Replaces camelCase, spaces, and underscores with lowercase hyphens.
 *
 * @function toKebabCase
 * @param {string} str - The input string to convert
 * @returns {string} The kebab-case version of the input
 *
 * @example
 * toKebabCase('MyFileName') // 'my-file-name'
 * toKebabCase('snake_case') // 'snake-case'
 */
const toKebabCase = (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/_/g, '-') // underscores to dashes
    .toLowerCase();
};

/**
 * Searches for markdown files in the `content` directory whose names include the given query.
 * The result includes the file name (without extension) and a kebab-case path relative to the `content` root.
 *
 * Skips hidden folders like `.git`, `.vscode`, and known infrastructure directories (`node_modules`, etc).
 *
 * @param {string} query - The search term to look for (case-insensitive).
 * @returns {Promise<Array<{ name: string, path: string }>>} A list of matched markdown files with their relative kebab-case paths.
 */
export const searchContent = async (
  query: string,
): Promise<{ name: string; path: string }[]> => {
  const contentDir = getContentFolder();

  /**
   * Recursively walks through a directory and its subdirectories to find matching `.md or .mdx` files.
   *
   * @param {string} dir - The absolute path of the directory to scan.
   * @param {string} base - The base relative path built from previous recursion steps.
   * @returns {Array<{ name: string, path: string }>}
   */
  const walk = (dir: string, base = '') => {
    const matches: { name: string; path: string }[] = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORED_FOLDERS.some((r) => r.test(entry.name))) continue;

      const fullPath = path.join(dir, entry.name);
      const rawStem = entry.name.replace(/\.(md|mdx)$/, '');
      const cleanStem = rawStem.replace(REGEX_CONTENT_SUFFIX, '');
      const kebabPath = path
        .join(base, toKebabCase(cleanStem))
        .replace(/\\/g, '/');

      if (entry.isDirectory()) {
        walk(fullPath, kebabPath);
      } else if (
        (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
        cleanStem.toLowerCase().includes(query.toLowerCase())
      ) {
        matches.push({ name: cleanStem, path: kebabPath });
      }
    }
    return matches;
  };

  return walk(contentDir);
};
