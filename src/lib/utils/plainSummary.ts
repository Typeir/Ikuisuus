/**
 * @fileoverview Plain-text summary helpers
 * @description Converts inline-markdown / shortcode source text into plain text
 * for compact display (table cells, chips), and truncates by word count. Mirrors
 * the character-creator pill-shard treatment: resolve `[% … %]` dice shortcodes
 * (a mini-compile), then strip inline markdown, then collapse whitespace.
 *
 * @module lib/utils/plainSummary
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { stripInlineMarkdown } from './stripInlineMarkdown';

/**
 * Reduces inline-markdown source to plain display text: resolves `[% … %]`
 * shortcode wrappers, strips inline markdown, and collapses whitespace/newlines
 * to single spaces.
 *
 * @function toPlainSummary
 * @param {string} text - Source text that may contain shortcodes/markdown
 * @returns {string} Collapsed plain text
 */
export function toPlainSummary(text: string): string {
  return stripInlineMarkdown(text.replace(/\[%\s*(.*?)\s*%\]/g, '$1'))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncates text to at most `maxWords` words, appending an ellipsis when it was
 * shortened.
 *
 * @function truncateWords
 * @param {string} text - Plain text to truncate
 * @param {number} maxWords - Maximum number of words to keep
 * @returns {string} The text, truncated to `maxWords` words with a trailing ellipsis when shortened
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}…`;
}
