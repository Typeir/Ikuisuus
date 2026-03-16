/**
 * @fileoverview MDX Heading Image Replacer
 * @description Replace the first markdown image in .sheet.mdx files
 * with a JSX BlendedImage component.
 *
 * @module mdxifyHeadingImages
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/mdxifyHeadingImages.ts
 * ```
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import glob from 'glob';
import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'mdxifyHeadingImages' });

const ROOT_DIR = resolve(process.cwd(), 'src', 'content');

const IMAGE_MARKDOWN_REGEX = /^!\[(.*?)\]\((.*?)\)$/;

/**
 * Replace the first markdown image in the first 10 lines of a .sheet.mdx file
 * with a JSX BlendedImage component.
 *
 * @param filePath - Absolute path to the .sheet.mdx file
 */
function replaceHeadingImage(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(IMAGE_MARKDOWN_REGEX);
    if (match) {
      const alt = match[1];
      const src = match[2];
      lines[i] = `<BlendedImage src="${src}" alt="${alt}" />`;
      log.message('Replaced image', { path: filePath, line: i + 1 });
      break;
    }
  }

  writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Main entry point: finds all .sheet.mdx files in the content directory
 * and replaces their heading markdown images.
 */
function main(): void {
  const pattern = join(ROOT_DIR, '**/*.sheet.mdx');
  glob(pattern, (err, files) => {
    if (err) {
      log.error('Error finding .sheet.mdx files', {
        error: err.message || String(err),
      });
      return;
    }
    files.forEach(replaceHeadingImage);
  });
}

main();
