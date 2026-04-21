/**
 * @fileoverview Filesystem Content Source Adapter
 * @description Implements the ContentSourceAdapter interface using the local
 * filesystem. Used during development and build phases where content lives
 * in `src/content/{locale}/`.
 *
 * @module lib/db/content/adapters/fs/fsContentSource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

import type {
  ContentFetchResult,
  ContentSourceAdapter,
} from '../../contentSourceAdapter';

const log = logger.child({ module: 'FsContentSource' });

/**
 * Filesystem-backed content source.
 * Reads content files from `src/content/{locale}/{slugPath}.mdx`.
 */
export const fsContentSource: ContentSourceAdapter = {
  async fetch(
    locale: string,
    slugPath: string,
  ): Promise<ContentFetchResult | null> {
    const rootDir = path.join(process.cwd(), 'src', 'content', locale);
    const slugDirectory = path.posix.dirname(slugPath);
    const relativeDirectory = slugDirectory === '.' ? '' : slugDirectory;
    const slugLeaf = path.posix.basename(slugPath);
    const fullDirectoryPath = path.join(rootDir, relativeDirectory);

    try {
      const entries = await fs.readdir(fullDirectoryPath, {
        withFileTypes: true,
      });
      const mdxFile = entries.find(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(slugLeaf) &&
          entry.name.endsWith('.mdx'),
      );

      if (!mdxFile) {
        return null;
      }

      const resolvedPath = path.join(fullDirectoryPath, mdxFile.name);
      const content = await fs.readFile(resolvedPath, 'utf8');
      log.message('Fetched MDX file from filesystem', {
        path: resolvedPath,
        requestedSlug: slugLeaf,
      });
      return { content, resolvedPath };
    } catch {
      return null;
    }
  },
};
