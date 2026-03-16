/**
 * @fileoverview Directory Tree Size Reporter
 * @description Recursively walks a directory and prints size of each folder.
 *
 * @module treeSize
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/treeSize.ts /path/to/folder
 * ```
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'treeSize' });

let totalItems = 0;
let totalBytes = 0;

/**
 * Recursively calculates the size of a folder.
 *
 * @param dir - Directory path
 * @returns Total bytes in the folder
 */
const getFolderSize = (dir: string): number => {
  let folderSize = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    totalItems++;

    if (entry.isDirectory()) {
      folderSize += getFolderSize(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      folderSize += stats.size;
    }
  }

  return folderSize;
};

/**
 * Prints a tree of directories with their sizes.
 *
 * @param dir - Directory to print
 * @param prefix - Indentation prefix
 */
const printTree = (dir: string, prefix = ''): void => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const folderSize = getFolderSize(dir);
  totalBytes += folderSize;

  const sizeMB = (folderSize / (1024 * 1024)).toFixed(2);
  log.message(`${prefix}${path.basename(dir)}/ — ${sizeMB} MB`);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      printTree(fullPath, prefix + '  ');
    }
  }
};

const targetDir = process.argv[2];

if (!targetDir) {
  log.error('Usage: npx tsx scripts/utils/treeSize.ts /path/to/folder');
  process.exit(1);
}

printTree(path.resolve(targetDir));

log.message('Summary', {
  totalItems,
  totalSize: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
});
