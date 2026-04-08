/**
 * Checks if a given file path corresponds to a raw Markdown file (.md).
 *
 * @param {string} filePath - The full file path to check.
 * @returns {boolean} - Returns true if the file ends with `.md`, otherwise false.
 * @fileoverview Module for src/lib/md/isMdFile.ts
 * @module src/lib/md/isMdFile
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
export const isMdFile = (filePath: string): boolean => filePath.endsWith('.md');
