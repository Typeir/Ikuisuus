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

import { CONTENT_SUFFIXES } from '@/lib/enums/constants';
import type {
    ContentFetchResult,
    ContentSourceAdapter,
} from '../../contentSourceAdapter';

const log = logger.child({ module: 'FsContentSource' });

/** @property {string[]} EXTENSIONS - File extension variants to try, in priority order */
const EXTENSIONS = ['.mdx', '.sheet.mdx', '.md'];

/**
 * Resolves a single semantic-suffixed filename candidate for a base slug.
 *
 * @param {string[]} fileNames - File names from a single directory
 * @param {string} slugLeaf - Base slug segment without directory prefix
 * @returns {string | null} Unique semantic filename, or null when none/ambiguous
 */
const resolveUniqueSemanticFileName = (
  fileNames: string[],
  slugLeaf: string,
): string | null => {
  const candidates = fileNames.filter((fileName) => {
    const matchedExtension = EXTENSIONS.find((extension) =>
      fileName.endsWith(extension),
    );
    if (!matchedExtension) {
      return false;
    }

    const stem = fileName.slice(0, -matchedExtension.length);
    return CONTENT_SUFFIXES.some((suffix) => stem === `${slugLeaf}${suffix}`);
  });

  return candidates.length === 1 ? candidates[0] : null;
};

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

    const slugDirectory = path.posix.dirname(slugPath);
    const relativeDirectory = slugDirectory === '.' ? '' : slugDirectory;
    const slugLeaf = path.posix.basename(slugPath);
    const fullDirectoryPath = path.join(rootDir, relativeDirectory);

    try {
      const entries = await fs.readdir(fullDirectoryPath, {
        withFileTypes: true,
      });
      const fileNames = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
      const semanticFileName = resolveUniqueSemanticFileName(
        fileNames,
        slugLeaf,
      );

      if (!semanticFileName) {
        return null;
      }

      const semanticFullPath = path.join(fullDirectoryPath, semanticFileName);
      const content = await fs.readFile(semanticFullPath, 'utf8');
      log.message('Fetched semantic fallback content from filesystem', {
        path: semanticFullPath,
        requestedSlugPath: slugPath,
      });
      return { content, resolvedPath: semanticFullPath };
    } catch {
      return null;
    }
  },
};
