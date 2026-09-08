/**
 * @fileoverview Text processing utilities.
 * @description Common text manipulation; no Node.js or filesystem dependencies.
 *
 * @module scripts/metadata/textUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { stripDiceWrappers } from '@/lib/md/diceExpressionParser';
import {
  KEYWORD_EXPR_REGEX,
  parseKeywordReference,
} from '@/lib/md/keywordExpressionParser';
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
 * Resolves every `[# kw:… #]` block to the words the page prints in its place.
 *
 * @description The block is a hover, not text
 *
 * @param {string} text - Text that may carry keyword blocks
 * @returns {string} Text with each block replaced by its display words
 */
function resolveKeywords(text: string): string {
  const pattern = new RegExp(KEYWORD_EXPR_REGEX.source, 'g');
  return text.replace(pattern, (full, inner: string) => {
    const reference = parseKeywordReference(inner);
    return reference ? reference.display : full;
  });
}

/**
 * Cleans text for atomic plaintext fields
 *
 * @description Dice and keyword blocks are authoring macros too, so they are
 * reduced to the text they render as
 *
 * @param {string} text - Input string for an atomic field
 * @returns {string} Cleaned string, free of markdown and of authoring macros
 */
export function plain(text: string): string {
  const withoutMarkup = stripMarkdown(clean(text)).replace(
    TEXT.markdownLink,
    '$1',
  );

  return toPlainMeasure(
    resolveKeywords(stripDiceWrappers(withoutMarkup)),
  ).trim();
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
 * line breaks so line numbers still match the source file.
 *
 * @param {string} raw - Raw MDX file content
 * @returns {string} Content with the frontmatter lines blanked
 */
export function blankFrontmatter(raw: string): string {
  return raw.replace(TEXT.frontmatterBlock, (block) =>
    block.replace(TEXT.nonLineBreak, ''),
  );
}
