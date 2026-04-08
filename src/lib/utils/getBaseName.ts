/**
 * Retrieves the base name of a file by removing the first extension segment.
 *
 * For example:
 *   "example.mdx" -> "example"
 *   "character.sheet.mdx" -> "character"
 *
 * @param {string} filename - The filename to process.
 * @returns {string} The base name before the first period.
 * @fileoverview Module for src/lib/utils/getBaseName.ts
 * @module src/lib/utils/getBaseName
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
export const getBaseName = (filename: string): string => filename.split('.')[0];
