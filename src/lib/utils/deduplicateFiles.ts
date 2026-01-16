import { getBaseName } from './getBaseName';

/**
 * Deduplicates a list of filenames by their base name.
 *
 * If two files share the same base name (e.g., "entry.mdx" and "entry.sheet.mdx"),
 * the file with the longer name is kept, assuming it has higher priority.
 *
 * @param {string[]} files - A sorted array of filenames.
 * @returns {string[]} Deduplicated array of filenames with preferred variants kept.
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
