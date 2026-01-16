/** src/lib/enums/constants.ts */

export const FILE_EXT_MD = '.md';
export const FILE_EXT_MDX = '.mdx';

// Regex patterns precompiled
export const REGEX_EXTENSION = /\.(md|mdx)$/;
export const REGEX_SHEET_SUFFIX = /\.sheet$/;

/**
 * Folder names to ignore during directory traversal.
 */
export const IGNORED_FOLDERS = [
  '.obsidian',
  '.git',
  'node_modules',
  '.vscode',
] as const;

/**
 * Supported markdown file extensions.
 */
export enum FileExtension {
  MD = '.md',
  MDX = '.mdx',
}

/**
 * Common regex patterns for filename processing.
 */
export const RegexPatterns = {
  Extension: /\.(md|mdx)$/,
  SheetSuffix: REGEX_SHEET_SUFFIX,
};

export enum FolderName {
  Src = 'src',
  Content = 'content',
}

// Supported file extensions
