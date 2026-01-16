/**
 * Checks if a given file path corresponds to a raw Markdown file (.md).
 *
 * @param {string} filePath - The full file path to check.
 * @returns {boolean} - Returns true if the file ends with `.md`, otherwise false.
 */
export const isMdFile = (filePath: string): boolean => filePath.endsWith('.md');
