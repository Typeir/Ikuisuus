/**
 * @fileoverview Filesystem Directory Source Adapter
 * @description Implements the DirectorySourceAdapter interface using the local
 * filesystem. Used during development and build phases where content lives
 * in `src/content/{locale}/`.
 *
 * @module lib/db/content/adapters/fs/fsDirectorySource
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import fs from 'fs';
import path from 'path';

import type {
    DirectoryEntry,
    DirectorySourceAdapter,
} from '../../directorySourceAdapter';

/**
 * Filesystem-backed directory source.
 * Lists directory contents from `src/content/{locale}/{relativePath}`.
 */
export const fsDirectorySource: DirectorySourceAdapter = {
  async listEntries(
    locale: string,
    relativePath: string,
  ): Promise<DirectoryEntry[]> {
    const dir = path.join(
      process.cwd(),
      'src',
      'content',
      locale,
      relativePath,
    );

    try {
      const stats = fs.statSync(dir);
      if (!stats.isDirectory()) return [];
    } catch {
      return [];
    }

    return fs
      .readdirSync(dir, { withFileTypes: true })
      .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
  },
};
