/**
 * @fileoverview Filesystem Content Source Adapter
 * @description Implements the ContentSourceAdapter interface using the local
 * filesystem. Used during development and build phases where content lives
 * in `src/content/{locale}/`.
 *
 * @module lib/db/content/adapters/fs/fsContentSource
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

import type {
  ContentFetchResult,
  ContentSourceAdapter,
} from '../../contentSourceAdapter';

const log = logger.child({ module: 'FsContentSource' });

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

/**
 * Filesystem-backed content source.
 * Reads content files from `src/content/{locale}/{slugPath}` with extension fallback.
 */
export const fsContentSource: ContentSourceAdapter = {
  async fetch(
    locale: string,
    slugPath: string,
  ): Promise<ContentFetchResult | null> {
    const rootDir = path.join(process.cwd(), 'src', 'content', locale);

    for (const ext of EXTENSIONS) {
      const fullPath = path.join(rootDir, `${slugPath}${ext}`);
      try {
        await fs.access(fullPath);
        const content = await fs.readFile(fullPath, 'utf8');
        log.message('Fetched content from filesystem', { path: fullPath });
        return { content, resolvedPath: fullPath };
      } catch {
        continue;
      }
    }

    return null;
  },
};
