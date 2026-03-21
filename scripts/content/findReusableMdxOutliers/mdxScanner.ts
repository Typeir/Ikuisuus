/**
 * MDX File Scanner
 *
 * @fileoverview Recursively discovers all .mdx files under a given directory tree.
 *
 * @module findReusableMdxOutliers/mdxScanner
 * @version 1.0.0
 * @since 3.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Recursively finds all .mdx files in a directory.
 *
 * @param dir - Root directory to search
 * @returns Array of absolute paths to .mdx files
 */
export const findMdxFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return findMdxFiles(res);
      if (res.endsWith('.mdx')) return res;
      return [] as string[];
    }),
  );

  return files.flat();
};
