/**
 * Directory Walker
 *
 * @fileoverview The one recursive directory walker. Every file-listing sweep
 * (generators, checks, indexers) goes through these instead of hand-rolling
 * traversal. Server only.
 *
 * @module lib/utils/getMatchingFiles
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger({ component: 'walk-directory' });

/**
 * Recursively walks a directory, pushing files matching a pattern to results.
 * Unreadable directories are logged and skipped.
 *
 * @param {string} dir - Directory to walk
 * @param {RegExp} pattern - Pattern to match filenames against
 * @param {string[]} results - Accumulator for matched paths
 * @returns {Promise<void>}
 */
export async function walkDirectory(
  dir: string,
  pattern: RegExp,
  results: string[],
): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDirectory(fullPath, pattern, results);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    log.error(`Error reading directory ${dir}`, {
      error: (error as Error).message,
    });
  }
}

/**
 * Returns paths of files matching a pattern in a directory.
 * When `recursive` is true, walks subdirectories and does not exclude
 * `main.mdx`. Non-recursive mode excludes `main.mdx`.
 *
 * @param {string} directory - Directory to search
 * @param {RegExp} pattern - Pattern to match filenames against
 * @param {boolean} [recursive=false] - Walk subdirectories recursively
 * @returns {Promise<string[]>} Matching file paths
 */
export async function getMatchingFiles(
  directory: string,
  pattern: RegExp,
  recursive = false,
): Promise<string[]> {
  if (recursive) {
    const results: string[] = [];
    await walkDirectory(directory, pattern, results);
    return results;
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          pattern.test(entry.name) &&
          entry.name !== 'main.mdx',
      )
      .map((entry) => path.join(directory, entry.name));
  } catch (error) {
    log.error(`Error reading directory ${directory}`, {
      error: (error as Error).message,
    });
    return [];
  }
}
