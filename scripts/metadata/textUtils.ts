/**
 * @fileoverview Text processing utilities.
 * @description Common text manipulation; no Node.js or filesystem dependencies.
 *
 * @module scripts/metadata/textUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import path from 'path';
import { SLUG, TEXT } from './parsingPatterns';

/**
 * Removes carriage returns and trims whitespace.
 *
 * @param {string} text - Input string to clean
 * @returns {string} Cleaned string
 */
export function clean(text: string): string {
  return (text || '').replace(TEXT.carriageReturn, '').trim();
}

/**
 * Cleans text for atomic plaintext fields: strips markdown, link syntax, and authoring macros.
 *
 * @param {string} text - Input string for an atomic field
 * @returns {string} Cleaned string, free of markdown and of authoring macros
 */
export function plain(text: string): string {
  const withoutMarkup = stripMarkdown(clean(text)).replace(
    TEXT.markdownLink,
    '$1',
  );

  return toPlainMeasure(withoutMarkup).trim();
}

/**
 * Removes markdown formatting like **bold**, _italic_, etc.
 *
 * @param {string} text - Input string with markdown
 * @returns {string} String without markdown formatting
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(TEXT.bold, '$1')
    .replace(TEXT.italic, '$1')
    .replace(TEXT.underscoreItalic, '$1')
    .replace(TEXT.inlineCode, '$1')
    .trim();
}

/**
 * Converts text to kebab-case format.
 *
 * @param {string} text - Input string to convert
 * @returns {string} String in kebab-case format
 */
export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(SLUG.nonAlpha, '-')
    .replace(SLUG.edgeHyphens, '');
}

/**
 * Extracts slug from file path by removing extensions.
 *
 * @param {string} filePath - Path to the file
 * @returns {string} Slug identifier
 */
export function filePathToSlug(filePath: string): string {
  return path
    .basename(filePath)
    .replace(SLUG.mdxExtension, '')
    .replace(SLUG.contentTypeSuffix, '');
}

/**
 * Splits raw text content into lines.
 *
 * @param {string} raw - Raw file content
 * @returns {string[]} Array of lines
 */
export function readLines(raw: string): string[] {
  return raw.split(TEXT.lineSplit);
}

/**
 * Empties a leading YAML frontmatter block, delimiters included, keeping its
 * line breaks so line numbers still match the source file. Content without
 * frontmatter is returned unchanged.
 *
 * @param {string} raw - Raw MDX file content
 * @returns {string} Content with the frontmatter lines blanked
 */
export function blankFrontmatter(raw: string): string {
  return raw.replace(TEXT.frontmatterBlock, (block) =>
    block.replace(TEXT.nonLineBreak, ''),
  );
}
