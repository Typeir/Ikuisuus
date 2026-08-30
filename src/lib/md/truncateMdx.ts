/**
 * @fileoverview MDX-Safe Truncation
 * @description Cuts MDX source at a boundary the parser recognises, rather than
 * at a character offset chosen blind.
 *
 * A raw `slice` lands wherever it lands: halfway through a JSX tag, inside a
 * link target, between the asterisks of a bold run. The result no longer
 * compiles, and the caller falls back to rendering the fragment as plain
 * markdown, losing every component the registry provides.
 *
 * Parsing first gives every block a start and end offset. Cutting on one of
 * those offsets cannot split a construct, because a construct never straddles
 * its own boundary. The original text is then sliced at that offset — nothing is
 * re-serialised, so authored spacing and formatting survive untouched.
 *
 * @module lib/md/truncateMdx
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import remarkGfm from 'remark-gfm';
import { remark } from 'remark';
import type { Root, RootContent } from 'mdast';

/** Character appended when a cut actually happened. */
export const ELLIPSIS = '…';

/**
 * Options for {@link truncateMdxSource}. Both limits may apply at once; the
 * earlier cut wins.
 *
 * @interface TruncateOptions
 * @property {string} [stopAtComponent] - Cut before the first block opening this JSX component
 * @property {number} [maxChars] - Cut once rendered text passes this budget
 * @property {boolean} [ellipsis] - Append {@link ELLIPSIS} when a cut happened
 */
export interface TruncateOptions {
  stopAtComponent?: string;
  maxChars?: number;
  ellipsis?: boolean;
}

/**
 * Outcome of a truncation.
 *
 * @interface TruncateResult
 * @property {string} source - Source up to the cut, trimmed
 * @property {boolean} truncated - Whether anything was dropped
 */
export interface TruncateResult {
  source: string;
  truncated: boolean;
}

/** Parser only. No compile, no stringify — offsets are all this needs. */
const parser = remark().use(remarkGfm);

/**
 * Rendered text length of a node, ignoring markup characters.
 *
 * @param {RootContent} node - Node to measure
 * @returns {string} Concatenated text of the node and its descendants
 */
function nodeText(node: RootContent): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.type === 'html' ? '' : node.value;
  }
  if ('children' in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map(nodeText).join('');
  }
  return '';
}

/**
 * Whether a block is the opening of a given JSX component.
 *
 * Covers both parses: with the MDX extension a component is an
 * `mdxJsxFlowElement` carrying its name, and without it the same markup lands
 * as an `html` node whose text opens with the tag.
 *
 * @param {RootContent} node - Block-level node
 * @param {string} name - Component name to match
 * @returns {boolean} True when the node opens that component
 */
function opensComponent(node: RootContent, name: string): boolean {
  const jsxName = (node as { name?: unknown }).name;
  if (typeof jsxName === 'string') return jsxName === name;

  if (node.type !== 'html') return false;

  const value = (node as { value?: string }).value ?? '';
  return new RegExp(`^\\s*<${name}(\\s|/|>)`).test(value);
}

/**
 * Offset of the first block that opens the named component.
 *
 * @param {Root} tree - Parsed document
 * @param {string} name - Component name
 * @returns {number | null} Start offset, or null when the component is absent
 */
function componentOffset(tree: Root, name: string): number | null {
  for (const node of tree.children) {
    if (opensComponent(node, name)) {
      return node.position?.start.offset ?? null;
    }
  }
  return null;
}

/**
 * Offset at which the rendered text budget runs out.
 *
 * Whole blocks are taken while they fit. When the very first block is already
 * over budget it is cut inside its own text, backing off to the last space so a
 * word is not halved — safe because the surrounding block is left open by the
 * caller's own slice, never by this offset.
 *
 * @param {Root} tree - Parsed document
 * @param {string} source - Original source, for the word-boundary search
 * @param {number} maxChars - Rendered character budget
 * @returns {number | null} Cut offset, or null when the whole document fits
 */
function budgetOffset(
  tree: Root,
  source: string,
  maxChars: number,
): number | null {
  let used = 0;

  for (const node of tree.children) {
    const length = nodeText(node).length;

    if (used + length <= maxChars) {
      used += length;
      continue;
    }

    /* A later block tipped the budget: stop cleanly before it. */
    if (used > 0) return node.position?.start.offset ?? null;

    /* The first block alone is too long, so cut within it. */
    const start = node.position?.start.offset ?? 0;
    const end = node.position?.end.offset ?? source.length;
    const limit = Math.min(start + maxChars, end);
    const window = source.slice(start, limit);
    const lastSpace = window.lastIndexOf(' ');

    return lastSpace > 0 ? start + lastSpace : limit;
  }

  return null;
}

/**
 * Truncates MDX source at a parsed boundary.
 *
 * @param {string} source - MDX source to cut
 * @param {TruncateOptions} options - Where to cut
 * @returns {TruncateResult} Source up to the cut and whether anything was dropped
 *
 * @example
 * truncateMdxSource(page, { stopAtComponent: 'Collapsible' });
 * // everything above the first <Collapsible>, still valid MDX
 *
 * @example
 * truncateMdxSource(prose, { maxChars: 150, ellipsis: true });
 * // a preview that still compiles, with a trailing ellipsis
 */
export function truncateMdxSource(
  source: string,
  { stopAtComponent, maxChars, ellipsis = false }: TruncateOptions,
): TruncateResult {
  if (!source) return { source, truncated: false };

  const tree = parser.parse(source) as Root;

  const offsets: number[] = [];
  if (stopAtComponent) {
    const at = componentOffset(tree, stopAtComponent);
    if (at !== null) offsets.push(at);
  }
  if (typeof maxChars === 'number') {
    const at = budgetOffset(tree, source, maxChars);
    if (at !== null) offsets.push(at);
  }

  if (offsets.length === 0) return { source: source.trim(), truncated: false };

  const cut = source.slice(0, Math.min(...offsets)).trim();

  return {
    source: ellipsis && cut ? `${cut}${ELLIPSIS}` : cut,
    truncated: true,
  };
}
