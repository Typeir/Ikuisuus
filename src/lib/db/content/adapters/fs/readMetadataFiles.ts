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

import { logger } from '@/lib/logging/logger';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import fs from 'fs/promises';
import path from 'path';

const log = logger.child({ module: 'ReadMetadataFiles' });

/**
 * Returns the `.meta/{locale}` directory at the project root.
 * @param {string} locale - Locale code
 * @returns {string} Absolute path to `.meta/{locale}`
 */
const getMetaFolder = (locale: string): string => {
  return path.join(process.cwd(), '.meta', locale);
};

/** Files opened at once, holding the descriptor count well under the platform limit. */
const READ_CONCURRENCY = 32;

/**
 * Reads and parses all `.metadata.json` files from a content subdirectory.
 *
 * @template T - The expected metadata record type
 * @param {string} locale - Locale code (e.g. 'en', 'es')
 * @param {string} subdir - Relative subdirectory inside `src/content/{locale}/`
 * @returns {T[]} Flattened metadata records
 *
 * @description
 * Reads in batches rather than one `Promise.all` over the tree: an empty
 * `subdir` covers every sidecar in the locale, and opening them all at once
 * exhausts the process descriptor table, which fails unrelated reads elsewhere
 * in the server. A file that cannot be read or parsed is skipped so one bad
 * sidecar costs its own record rather than the whole call.
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
    try {
      await fs.stat(dirPath);
    } catch {
      return [];
    }
  }

  const files = await fs.readdir(dirPath, { recursive: true });
  const metadataFiles = (files as string[]).filter((f) =>
    f.endsWith('.metadata.json'),
  );

  const records: unknown[] = [];

  for (let i = 0; i < metadataFiles.length; i += READ_CONCURRENCY) {
    const batch = metadataFiles.slice(i, i + READ_CONCURRENCY);
    const parsed = await Promise.all(
      batch.map(async (file) => {
        try {
          const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
          return JSON.parse(content) as unknown;
        } catch (error) {
          log.warning('Skipped unreadable metadata sidecar', {
            file,
            locale,
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      }),
    );

    for (const record of parsed) {
      if (record !== null) records.push(record);
    }
  }

  return records.flat() as T[];
};
