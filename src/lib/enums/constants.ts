/** src/lib/enums/constants.ts */

export const FILE_EXT_MD = '.md';
export const FILE_EXT_MDX = '.mdx';

// Regex patterns precompiled
export const REGEX_EXTENSION = /\.(md|mdx)$/;
export const REGEX_SHEET_SUFFIX = /\.sheet$/;

/**
 * Patterns for entries to ignore during directory traversal.
 * Any entry whose name matches at least one pattern is excluded.
 * Covers dot-prefixed folders/files and known tooling directories.
 */
export const IGNORED_FOLDERS: RegExp[] = [
  /^\./, // any dot-prefixed name (.git, .obsidian, .draft, …)
  /^node_modules$/,
];

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
