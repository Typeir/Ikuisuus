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
import fs from 'fs';
import path from 'path';

/**
 * Reads and parses all `.metadata.json` files from a content subdirectory.
 *
 * Returns an empty array if the directory does not exist or cannot be read.
 * Multi-record files (arrays) are automatically flattened.
 *
 * @template T - The expected metadata record type
 * @param {string} locale - Locale code (e.g. 'en', 'es')
 * @param {string} subdir - Relative subdirectory inside `src/content/{locale}/`
 * @returns {T[]} Flattened metadata records
 */
export const readMetadataFiles = <T>(locale: string, subdir: string): T[] => {
  const dirPath = path.join(getContentFolder(locale), subdir);

  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

  const records = metadataFiles.map((file) => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    return JSON.parse(content);
  });

  return records.flat() as T[];
};
