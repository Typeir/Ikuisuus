/**
 * Kebabifies all folders and `.mdx` files in `src/content/` recursively.
 *
 * @fileoverview Content filename normalization script.
 * - Skips ignored folders
 * - Handles renaming safely (depth-first)
 *
 * @module kebabifyContent
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'kebabifyContent' });

/** Folder and file names to ignore */
const IGNORED = new Set([
  '.git',
  '.obsidian',
  'node_modules',
  '.vscode',
  '.DS_Store',
]);

/**
 * Converts a string to kebab-case
 * @param str - Input string
 * @returns Kebab-cased string
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase();
}

/**
 * Recursively renames folders and `.mdx` files to kebab-case.
 * @param dir - Directory to process
 */
function kebabifyDirectory(dir: string): void {
  const entries: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      kebabifyDirectory(fullPath);

      const kebabName = toKebabCase(entry.name);
      if (entry.name !== kebabName) {
        const kebabPath = path.join(dir, kebabName);
        fs.renameSync(fullPath, kebabPath);
        log.message('📁 Renamed folder', { from: entry.name, to: kebabName });
      }
    }
  }

  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && path.extname(entry.name) === '.mdx') {
      const baseName = path.basename(entry.name, '.mdx');
      const kebabName = toKebabCase(baseName);
      const newFile = path.join(dir, `${kebabName}.mdx`);

      if (entry.name !== `${kebabName}.mdx`) {
        fs.renameSync(fullPath, newFile);
        log.message('📝 Renamed file', {
          from: entry.name,
          to: `${kebabName}.mdx`,
        });
      }
    }
  }
}

log.message('🔁 Kebabifying content folder...');

try {
  ['en'].forEach((locale) =>
    kebabifyDirectory(path.join(process.cwd(), 'src', 'content', locale)),
  );
  log.message('✅ All done.');
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  log.error('✖ Error during kebabification', { error: message });
  process.exit(1);
}
