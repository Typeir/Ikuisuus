/**
 * @fileoverview Pure Text Processing Utilities
 * @description Common text manipulation functions used across metadata generators
 * and runtime services. No Node.js or filesystem dependencies.
 *
 * @module lib/metadata/textUtils
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
 * Cleans text destined for an **atomic plaintext field**.
 *
 * A title, name, tag or language is consumed by things that never run a
 * renderer over it: an `og:description` meta tag, a Pagefind search key, a table
 * cell, a section lookup. Authoring syntax reaching one of those is not markup
 * awaiting a pass, it is a token the reader sees — `Rope ([= 10 stride =])` in a
 * page title, `unique:reach-([=-6-stride-=]` in a facet.
 *
 * Markdown goes the same way and for the same reason. A feature called
 * `Expulsion Strike _(Minor Action)_` is named that in a table cell, and a lore
 * page titled `**Demons / Hiisi**:` carries its asterisks into the browser tab.
 * Emphasis, inline code and link syntax are all markup a plaintext consumer
 * renders literally; the link's label survives, its target does not.
 *
 * Prose keeps both its macros and its markdown. Rules text is rendered through
 * the MDX pipeline, where the markup is the whole point.
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
