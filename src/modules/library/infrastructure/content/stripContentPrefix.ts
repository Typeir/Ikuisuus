/**
 * @fileoverview Strips source-root prefix from content file paths.
 * @module modules/library/infrastructure/content/stripContentPrefix
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Removes the src/content/en prefix from a content file path.
 *
 * @param {string} filePath - Original metadata file path.
 * @returns {string} Content-root relative path.
 */
export function stripContentPrefix(filePath: string): string {
  return filePath.replace(/^src\/content\/en\//, '');
}
