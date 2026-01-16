/**
 * Retrieves the base name of a file by removing the first extension segment.
 *
 * For example:
 *   "example.mdx" -> "example"
 *   "character.sheet.mdx" -> "character"
 *
 * @param {string} filename - The filename to process.
 * @returns {string} The base name before the first period.
 */
export const getBaseName = (filename: string): string => filename.split('.')[0];
