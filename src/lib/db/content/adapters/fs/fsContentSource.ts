/**
 * @fileoverview Filesystem Content Source Adapter
 * @description Implements the ContentSourceAdapter interface using the
 * local filesystem. Reads content from `src/content/{locale}/`.
 *
 * @module lib/db/content/adapters/fs/fsContentSource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';
import { resolveIndexFile } from '@/lib/constants/content';

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
    const rootDir = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      'src',
      'content',
      locale,
    );
    const slugDirectory = path.posix.dirname(slugPath);
    const relativeDirectory = slugDirectory === '.' ? '' : slugDirectory;
    const slugLeaf = path.posix.basename(slugPath);
    const fullDirectoryPath = path.join(
      /*turbopackIgnore: true*/ rootDir,
      relativeDirectory,
    );

    try {
      const entries = await fs.readdir(fullDirectoryPath, {
        withFileTypes: true,
      });
      const mdxFile = entries.find(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.mdx') &&
          (entry.name === `${slugLeaf}.mdx` ||
            entry.name.startsWith(`${slugLeaf}.`)),
      );

      const folderEntry = entries.find(
        (entry) => entry.isDirectory() && entry.name === slugLeaf,
      );

      if (!mdxFile && !folderEntry) {
        return null;
      }

      let resolvedPath: string;

      if (mdxFile) {
        resolvedPath = path.join(
          /*turbopackIgnore: true*/ fullDirectoryPath,
          mdxFile.name,
        );
      } else {
        const folderPath = path.join(
          /*turbopackIgnore: true*/ fullDirectoryPath,
          slugLeaf,
        );
        const folderFiles = await fs.readdir(folderPath, {
          withFileTypes: true,
        });
        const indexFile = resolveIndexFile(
          folderFiles.filter((e) => e.isFile()).map((e) => e.name),
          slugLeaf,
        );
        if (!indexFile) {
          return null;
        }
        resolvedPath = path.join(
          /*turbopackIgnore: true*/ folderPath,
          indexFile,
        );
      }
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
