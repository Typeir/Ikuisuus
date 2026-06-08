/**
 * @fileoverview Truncated MDX Cleanup
 * @description Tail-only cleanup for MDX fragments produced by a fixed-length
 * `String.prototype.slice` cut. Removes dangling tokens that would compile to
 * unmatched markup or visible orphaned punctuation in tooltip / preview
 * snippets (incomplete HTML tags, half-written markdown links, unbalanced
 * emphasis runs, trailing table pipes, list/rule dashes, etc.).
 *
 * The function is intentionally conservative: it only mutates the tail of the
 * input. Leading content is assumed intact because truncation is performed at
 * the end. The output is safe to pass to a markdown/MDX compiler.
 *
 * @module lib/utils/cleanTruncatedMdx
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { stripUnmatchedJsxTags } from './stripUnmatchedJsxTags';

/**
 * Inline delimiter pairs whose tail-side orphans should be stripped. Order
 * matters: longer sequences (e.g. `**`, `~~`) are processed before their
 * single-character counterparts so that a stray `*` left over from a `**bold`
 * fragment is removed in one pass.
 *
 * @constant {string[]} TAIL_DELIMITERS
 */
const TAIL_DELIMITERS = ['~~', '**', '__', '*', '_', '`'] as const;

/**
 * Trailing orphan characters that have no value once the markup tail has
 * already been pruned (table pipes, list/rule dashes, alignment colons,
 * trailing commas/semicolons, whitespace).
 *
 * @constant {RegExp} ORPHAN_TAIL
 */
const ORPHAN_TAIL = /[\s|:,;\-–—]+$/;

/**
 * Removes the trailing occurrence of `token` from `s` if the total count of
 * that token in the string is odd (i.e. unmatched).
 *
 * @function stripUnmatchedTail
 * @param {string} s - Input string
 * @param {string} token - Delimiter token to balance
 * @returns {string} String with the dangling token trimmed when unmatched
 */
const stripUnmatchedTail = (s: string, token: string): string => {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const count = (s.match(new RegExp(escaped, 'g')) ?? []).length;
  if (count === 0 || count % 2 === 0) return s;
  const idx = s.lastIndexOf(token);
  if (idx === -1) return s;
  return s.slice(0, idx) + s.slice(idx + token.length);
};

/**
 * Cleans the tail of a length-truncated MDX fragment so the result compiles
 * cleanly and renders without orphaned punctuation. Applies, in order:
 *
 *   1. Strip incomplete HTML/JSX tag (`<...` with no closing `>`).
 *   2. Strip incomplete markdown link or image (`[text](url`, `[text`).
 *   3. Remove unmatched JSX/HTML element tags (e.g. `<Collapsible>` whose
 *      `</Collapsible>` was lost to truncation, or stray closing tags).
 *   4. Balance inline delimiters by removing the trailing unmatched copy.
 *   5. Trim trailing pipes, dashes, colons, commas, and whitespace.
 *
 * The function never touches the leading portion of the string except to
 * remove unmatched element tags, never adds characters, and never throws.
 *
 * @function cleanTruncatedMdx
 * @param {string} input - MDX fragment produced by a fixed-length slice
 * @returns {string} Cleaned fragment safe to compile and display
 *
 * @example
 * cleanTruncatedMdx('A **bold start that was cut off | col |')
 *   // -> 'A bold start that was cut off'
 */
export const cleanTruncatedMdx = (input: string): string => {
  if (!input) return input;
  let out = input;

  out = out.replace(/<[^>]*$/, '');
  out = out.replace(/!?\[[^\]]*\]\([^)]*$/, '');
  out = out.replace(/!?\[[^\]]*$/, '');

  out = stripUnmatchedJsxTags(out);

  for (const token of TAIL_DELIMITERS) {
    out = stripUnmatchedTail(out, token);
  }

  out = out.replace(ORPHAN_TAIL, '');
  return out;
};
