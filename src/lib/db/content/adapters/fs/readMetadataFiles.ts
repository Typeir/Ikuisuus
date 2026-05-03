/**
 * @fileoverview Filesystem Metadata Reader Utility
 * @description Shared helper for reading `.metadata.json` sidecar files from the
 * content directory tree. Used by all entity-specific filesystem repository
 * implementations to avoid duplicating directory traversal logic.
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
 * When METADATA_BACKEND is 'pg', checks `.meta/{locale}/{subdir}` first, then
 * falls back to `src/content/{locale}/{subdir}`. When 'fs' or unset, reads
 * directly from `src/content/{locale}/{subdir}` to avoid stale `.meta/` data.
 *
 * Returns an empty array if neither directory exists or cannot be read.
 * Multi-record files (arrays) are automatically flattened.
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

  const files = await fs.readdir(dirPath);
  const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

  const records = await Promise.all(
    metadataFiles.map(async (file) => {
      const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
      return JSON.parse(content);
    }),
  );

  return records.flat() as T[];
};
