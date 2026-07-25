/**
 * @fileoverview Inline Markdown Stripper
 * @description Removes inline markdown from a string, yielding plain text for
 * compact UI labels (vocation proficiency summaries, boon pip effects) where
 * markdown must not render. Handles paired emphasis/code/link syntax and also
 * clears stray, unpaired `**`/`__`/`` ` `` markers left behind when a bold run
 * is split across values (e.g. a table cell `**Light, Medium, Heavy**` parsed
 * into `["**Light", "Medium", "Heavy**"]`). Block-level markdown is out of scope.
 *
 * @module lib/utils/stripInlineMarkdown
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * Strips inline markdown emphasis, code, and link markers from a string,
 * returning the readable text they wrap.
 *
 * @function stripInlineMarkdown
 * @param {string} text - Raw text that may contain inline markdown
 * @returns {string} Plain text with inline markdown markers removed
 *
 * @description
 * Applied in order:
 * 1. `[text](url)` links collapse to their `text`.
 * 2. Paired `**bold**`, `__bold__`, `*italic*`, and `` `code` `` unwrap to their
 *    inner content.
 * 3. Any remaining unpaired `**`, `__`, or backtick markers are removed, so a
 *    bold run split across array values still renders clean.
 *
 * Single-underscore `_italic_` is intentionally not handled so identifiers such
 * as `snake_case_name` survive intact.
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
