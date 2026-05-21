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
 * Regex matching a complete HTML/JSX tag (open, close, or self-closing).
 * Captures: 1 = leading slash (close tag), 2 = tag name, 3 = trailing slash
 * (self-closing).
 *
 * @constant {RegExp} JSX_TAG
 */
const JSX_TAG = /<(\/?)([A-Za-z][A-Za-z0-9]*)\b[^>]*?(\/?)>/g;

/**
 * Removes JSX/HTML element tags whose counterpart was lost to truncation:
 * unmatched open tags (closing tag fell beyond the slice) and stray close
 * tags (opening tag fell before the slice). Self-closing tags are preserved.
 *
 * Matching uses a simple stack: when a close tag is encountered, the nearest
 * open tag with the same name is paired with it and any open tags above it
 * on the stack are marked unmatched (they cannot legally close after a parent
 * has already closed).
 *
 * @function stripUnmatchedJsxTags
 * @param {string} s - Input string
 * @returns {string} String with unmatched JSX/HTML tags removed
 */
const stripUnmatchedJsxTags = (s: string): string => {
  type Tag = {
    start: number;
    end: number;
    isClose: boolean;
    isSelf: boolean;
    name: string;
  };
  const tags: Tag[] = [];
  let m: RegExpExecArray | null;
  JSX_TAG.lastIndex = 0;
  while ((m = JSX_TAG.exec(s)) !== null) {
    tags.push({
      start: m.index,
      end: m.index + m[0].length,
      isClose: m[1] === '/',
      isSelf: m[3] === '/',
      name: m[2],
    });
  }
  const stack: number[] = [];
  const remove = new Set<number>();
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    if (t.isSelf) continue;
    if (!t.isClose) {
      stack.push(i);
      continue;
    }
    let foundAt = -1;
    for (let j = stack.length - 1; j >= 0; j--) {
      if (tags[stack[j]].name === t.name) {
        foundAt = j;
        break;
      }
    }
    if (foundAt === -1) {
      remove.add(i);
      continue;
    }
    while (stack.length - 1 > foundAt) remove.add(stack.pop()!);
    stack.pop();
  }
  for (const idx of stack) remove.add(idx);
  if (remove.size === 0) return s;
  const sorted = [...remove].sort((a, b) => b - a);
  let out = s;
  for (const idx of sorted) {
    const t = tags[idx];
    out = out.slice(0, t.start) + out.slice(t.end);
  }
  return out;
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
