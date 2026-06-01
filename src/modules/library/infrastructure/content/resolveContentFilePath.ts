/**
 * @fileoverview Resolves locale content file paths across supported suffix variants.
 * @module modules/library/infrastructure/content/resolveContentFilePath
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Resolves an existing content file path for a slug.
 *
 * @param {string} rootDir - Locale content root directory.
 * @param {string} slugPath - Slash-separated slug path.
 * @returns {Promise<string | null>} Absolute file path when found.
 */
export async function resolveContentFilePath(
  rootDir: string,
  slugPath: string,
): Promise<string | null> {
  const variants = [
    `${slugPath}.mdx`,
    `${slugPath}.sheet.mdx`,
    `${slugPath}.md`,
  ];

  for (const variant of variants) {
    const fullPath = path.join(rootDir, variant);

    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      continue;
    }
  }

  return null;
}
