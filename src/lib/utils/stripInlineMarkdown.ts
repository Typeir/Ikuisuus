/**
 * @fileoverview Removes inline markdown markers from a string.
 * @description Handles paired emphasis/code/link syntax and removes unpaired
 * `**`/`__`/`` ` `` markers. Block-level markdown is out of scope.
 *
 * @module lib/utils/stripInlineMarkdown
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Removes inline markdown emphasis, code, and link markers from a string.
 *
 * @function stripInlineMarkdown
 * @param {string} text - Raw text that may contain inline markdown
 * @returns {string} Text with inline markdown markers removed
 *
 * @description
 * Applied in order:
 * 1. `[text](url)` links collapse to their `text`.
 * 2. Paired `**bold**`, `__bold__`, `*italic*`, and `` `code` `` unwrap to their
 *    inner content.
 * 3. Remaining unpaired `**`, `__`, or backtick markers are removed.
 *
 * Single-underscore `_italic_` is not handled.
 *
 * @example
 * stripInlineMarkdown('**Light**, Medium, **Heavy**');
 * // Returns: 'Light, Medium, Heavy'
 *
 * @example
 * stripInlineMarkdown('**Martial');
 * // Returns: 'Martial'
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*|__|`/g, '');
}
