/**
 * @fileoverview Reads `.metadata.json` sidecar files from the content tree.
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
 * With METADATA_BACKEND 'pg', checks `.meta/{locale}/{subdir}` first, then
 * falls back to `src/content/{locale}/{subdir}`. Otherwise reads from
 * `src/content/{locale}/{subdir}` directly.
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
  const contentPath = path.join(getContentFolder(locale), subdir);
  const backend = process.env.METADATA_BACKEND || 'fs';
  let dirPath: string;

  if (backend === 'pg') {
    const metaPath = path.join(getMetaFolder(locale), subdir);
    try {
      await fs.stat(metaPath);
      dirPath = metaPath;
    } catch {
      dirPath = contentPath;
    }
  } else {
    dirPath = contentPath;
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
