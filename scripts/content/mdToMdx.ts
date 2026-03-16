/**
 * Markdown to MDX Extension Converter
 *
 * @fileoverview Converts .md files to .mdx extension for Next.js MDX processing.
 * Part of the pre-initialization build pipeline (Stage 3).
 *
 * @module mdToMdx
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 *
 * @description
 * Recursively scans content directories and renames all .md files to .mdx.
 * Required because Next.js MDX plugin only processes .mdx files.
 *
 * @example
 * npx tsx scripts/content/mdToMdx.ts
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'mdToMdx' });

/**
 * Recursively walks a directory and renames all `.md` files to `.mdx`.
 *
 * @param dir - The directory to traverse
 */
function renameMarkdownToMdx(dir: string): void {
  const entries: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      renameMarkdownToMdx(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const newPath = fullPath.replace(/\.(md|mdx)$/, '.mdx');

      try {
        fs.renameSync(fullPath, newPath);
        log.message('✅ Renamed', { from: fullPath, to: newPath });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.error('❌ Failed to rename', { path: fullPath, error: message });
      }
    }
  }
}

['en'].forEach((locale) =>
  renameMarkdownToMdx(path.join(process.cwd(), 'src', 'content', locale)),
);
