/**
 * @fileoverview Reads `.metadata.json` files from the `.meta` mirror tree.
 * @description Shared helper to read and parse `.metadata.json` files for the
 * filesystem content repository adapters.
 *
 * @module lib/db/content/adapters/fs/readMetadataFiles
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { getContentFolder } from '@/lib/utils/getContentFolder';
import fs from 'fs/promises';
import path from 'path';

/**
 * Returns the `.meta/{locale}` directory at the project root.
 * @param {string} locale - Locale code
 * @returns {string} Absolute path to `.meta/{locale}`
 */
const getMetaFolder = (locale: string): string => {
  return path.join(process.cwd(), '.meta', locale);
};

/**
 * Reads and parses all `.metadata.json` files from a content subdirectory.
 *
 * Reads `.meta/{locale}/{subdir}`, falling back to
 * `src/content/{locale}/{subdir}` when the mirror tree is absent.
 *
 * Returns an empty array if neither directory exists or cannot be read.
 * Multi-record files (arrays) are flattened.
 *
 * @template T - The expected metadata record type
 * @param {string} locale - Locale code (e.g. 'en', 'es')
 * @param {string} subdir - Relative subdirectory inside `src/content/{locale}/`
 * @returns {T[]} Flattened metadata records
 */
export const readMetadataFiles = async <T>(
  locale: string,
  subdir: string,
): Promise<T[]> => {
  const metaPath = path.join(getMetaFolder(locale), subdir);
  let dirPath: string;

  try {
    await fs.stat(metaPath);
    dirPath = metaPath;
  } catch {
    dirPath = path.join(getContentFolder(locale), subdir);
  }

  try {
    await fs.stat(dirPath);
  } catch {
    return [];
  }

  const files = await fs.readdir(dirPath, { recursive: true });
  const metadataFiles = (files as string[]).filter((f) =>
    f.endsWith('.metadata.json'),
  );

  const records = await Promise.all(
    metadataFiles.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
      return JSON.parse(content);
    }),
  );

  return records.flat() as T[];
};
