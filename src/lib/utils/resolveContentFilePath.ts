/**
 * @fileoverview Content File Path Resolver - Multi-format file resolution for MDX content
 * @description Attempts to locate content files with multiple extension variants (.mdx, .sheet.mdx, .md)
 * within a locale-specific content directory. Used by dynamic routing to handle legacy markdown
 * files and specialized monster stat block formats. Returns null if no variant exists.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs/promises
 * @requires path
 * 
 * @example
 * ```typescript
 * import { resolveContentFilePath } from '@/lib/utils/resolveContentFilePath';
 * 
 * const filePath = await resolveContentFilePath(
 *   '/path/to/content/en',
 *   'monsters/albedo'
 * );
 * // Returns: '/path/to/content/en/monsters/albedo.sheet.mdx'
 * ```
 * @module src/lib/utils/resolveContentFilePath
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * Attempts to resolve the correct content file path for a given slug.
 * Checks for `.mdx`, `.sheet.mdx`, and `.md` variants in the provided root directory.
 *
 * @param {string} rootDir - The absolute path to the content root directory for the current locale.
 * @param {string} slugPath - The slug path joined into a single string (e.g., "library/items/metabolic-furnace").
 * @returns {Promise<string | null>} - The resolved file path if found, otherwise null.
 */
export const resolveContentFilePath = async (
  rootDir: string,
  slugPath: string
): Promise<string | null> => {
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
    }
  }

  return null;
};
