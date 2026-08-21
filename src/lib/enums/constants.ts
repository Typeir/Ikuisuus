/**
 * @fileoverview File extension constants, regex patterns, and folder name enums for content processing.
 * @module src/lib/enums/constants
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
/** Markdown file extension constant */
export const FILE_EXT_MD = '.md';
/** MDX file extension constant */
export const FILE_EXT_MDX = '.mdx';

/** Precompiled regex matching .md or .mdx extensions */
export const REGEX_EXTENSION = /\.(md|mdx)$/;
/** Precompiled regex matching .sheet suffix */
export const REGEX_SHEET_SUFFIX = /\.sheet$/;

/**
 * All recognized content-type suffixes following the double-extension convention.
 * Each content file uses `basename.{suffix}.mdx` to declare its type.
 */
export const CONTENT_SUFFIXES = [
  '.sheet',
  '.specialization',
  '.list',
  '.heirloom',
  '.trinket',
  '.bloodline',
  '.lore',
  '.spell',
  '.feat',
  '.tool',
  '.rule',
  '.boon',
] as const;

/** Precompiled regex matching any content-type suffix from the double-extension convention */
export const REGEX_CONTENT_SUFFIX =
  /\.(sheet|specialization|list|heirloom|trinket|bloodline|lore|spell|feat|tool|rule|boon)$/;

/** Slug of the index file that stands for its containing folder */
export const MAIN_INDEX_SLUG = 'main';

/** Filename of the index file that stands for its containing folder */
export const MAIN_INDEX_FILE = `${MAIN_INDEX_SLUG}${FILE_EXT_MDX}`;

/** Route segment under which all library content is served */
export const LIBRARY_SEGMENT = 'library';

/**
 * Whether a filename is the index file standing for its containing folder,
 * in either markdown extension.
 *
 * @param {string} fileName - Filename including extension
 * @returns {boolean} True for `main.mdx` and `main.md`
 *
 * @example
 * isMainIndexFile('main.mdx')  // true
 * isMainIndexFile('main.md')   // true
 * isMainIndexFile('bane.mdx')  // false
 */
export function isMainIndexFile(fileName: string): boolean {
  return (
    fileName === MAIN_INDEX_FILE || fileName === `${MAIN_INDEX_SLUG}.md`
  );
}

/**
 * Strips any recognized content-type suffix from a slug or filename stem.
 *
 * @param {string} slug - Slug or filename stem that may contain a content suffix
 * @returns {string} Clean slug with content suffix removed
 *
 * @example
 * stripContentSuffix('blackbone-crusher.heirloom') // 'blackbone-crusher'
 * stripContentSuffix('ancient-red-dragon.sheet')   // 'ancient-red-dragon'
 * stripContentSuffix('fireball')                    // 'fireball'
 */
export function stripContentSuffix(slug: string): string {
  return slug.replace(REGEX_CONTENT_SUFFIX, '');
}

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
  ContentSuffix: REGEX_CONTENT_SUFFIX,
};

/** Standard folder names used in content processing. */
export enum FolderName {
  Src = 'src',
  Content = 'content',
}
