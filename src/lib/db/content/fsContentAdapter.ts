/**
 * @fileoverview Filesystem Content Metadata Adapter
 * @description Implements `ContentAdapter` by reading `.metadata.json` sidecar
 * files from the local content directory (`src/content/{locale}/…`).
 *
 * This is the default adapter used during local development and for
 * statically-generated builds where all content lives on disk.
 *
 * @module lib/db/content/fsContentAdapter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import fs from 'fs';
import path from 'path';
import type { ContentAdapter, ContentCategory } from './contentAdapter';

const log = logger.child({ module: 'FSContent' });

/* ──────────────────────  Category → Path map  ─────────────────────── */

/**
 * Maps a `ContentCategory` to its relative subdirectory inside
 * `src/content/{locale}/`.
 *
 * @param {ContentCategory} category - Content category
 * @returns {string} Relative subdirectory path (e.g. 'monsters', 'items/heirlooms')
 */
const categoryToSubdir = (category: ContentCategory): string => {
  switch (category) {
    case 'monsters':
      return 'monsters';
    case 'heirlooms':
      return path.join('items', 'heirlooms');
    case 'spells':
      return 'spells';
    case 'trinkets':
      return path.join('items', 'trinkets');
  }
};

/* ──────────────────────  Internal reader  ──────────────────────────── */

/**
 * Reads and parses all `.metadata.json` files from a directory.
 * Returns an empty array if the directory does not exist.
 *
 * @param {string} dirPath - Absolute path to scan
 * @returns {Record<string, unknown>[]} Flattened metadata records
 */
const readMetadataDir = (dirPath: string): Record<string, unknown>[] => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

  const records = metadataFiles.map((file) => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    return JSON.parse(content);
  });

  return records.flat();
};

/* ───────────────────────────  Adapter  ─────────────────────────────── */

/**
 * Filesystem content adapter.
 *
 * Reads `.metadata.json` sidecar files from `src/content/{locale}/{subdir}/`.
 * Each file may contain a single object or an array (multi-variant stat blocks).
 * Results are flattened into a single array.
 */
export const fsContentAdapter: ContentAdapter = {
  listMetadata: async (
    category: ContentCategory,
    locale: string,
  ): Promise<Record<string, unknown>[]> => {
    try {
      const contentDir = getContentFolder(locale);
      const targetDir = path.join(contentDir, categoryToSubdir(category));
      return readMetadataDir(targetDir);
    } catch (error) {
      log.error(`Error reading ${category} metadata from filesystem`, {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listMetadataBySlugs: async (
    category: ContentCategory,
    locale: string,
    slugs?: string[],
  ): Promise<Record<string, unknown>[]> => {
    const all = await fsContentAdapter.listMetadata(category, locale);
    if (!slugs || slugs.length === 0) {
      return all;
    }
    return all.filter(
      (record) =>
        typeof record.slug === 'string' && slugs.includes(record.slug),
    );
  },
};
