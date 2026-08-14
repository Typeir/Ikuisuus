/**
 * @fileoverview Module for src/lib/utils/deduplicateFiles.ts
 * @module src/lib/utils/deduplicateFiles
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { getBaseName } from './getBaseName';

/**
 * Deduplicates a list of filenames by their base name.
 *
 * If two files share the same base name (e.g., "entry.mdx" and "entry.sheet.mdx"),
 * the file with the longer name is kept.
 *
 * @param {string[]} files - A sorted array of filenames.
 * @returns {string[]} Deduplicated array of filenames; longer name kept per base name.
 */
export const deduplicateFiles = (files: string[]): string[] => {
  const result: string[] = [];

  for (const file of files) {
    if (result.length === 0) {
      result.push(file);
      continue;
    }

    const lastFile = result[result.length - 1];
    if (getBaseName(lastFile) === getBaseName(file)) {
      if (file.length > lastFile.length) {
        result[result.length - 1] = file;
      }
    } else {
      result.push(file);
    }
  }

  return result;
};
