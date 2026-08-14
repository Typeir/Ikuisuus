/**
 * @fileoverview Truncated MDX Cleanup
 * @description Cleanup for MDX fragments produced by a fixed-length slice.
 * Removes dangling tokens that would compile to unmatched markup or orphaned
 * punctuation in tooltip/preview snippets.
 *
 * @module lib/utils/cleanTruncatedMdx
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { stripUnmatchedJsxTags } from './stripUnmatchedJsxTags';

/**
 * Inline delimiter pairs whose tail-side orphans are stripped, ordered longest
 * first so `**` is stripped before `*`.
 *
 * @constant {string[]} TAIL_DELIMITERS
 */
const TAIL_DELIMITERS = ['~~', '**', '__', '*', '_', '`'] as const;

/**
 * Trailing orphan characters stripped after delimiter pruning: table pipes,
 * list/rule dashes, alignment colons, commas/semicolons, whitespace.
 *
 * @constant {RegExp} ORPHAN_TAIL
 */
const ORPHAN_TAIL = /[\s|:,;\-–—]+$/;

/**
 * Removes the trailing `token` from `s` if its count in the string is odd
 * (unmatched).
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
 * Cleans the tail of a length-truncated MDX fragment: strips incomplete tags,
 * unmatched element tags, unbalanced inline delimiters, and trailing
 * punctuation/whitespace. Never adds characters and never throws.
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
