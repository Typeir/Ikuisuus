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
  '.reference',
  '.heirloom',
  '.trinket',
  '.bloodline',
  '.lore',
] as const;

/** Precompiled regex matching any content-type suffix from the double-extension convention */
export const REGEX_CONTENT_SUFFIX =
  /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/;

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
