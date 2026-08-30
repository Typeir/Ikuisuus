/**
 * @fileoverview Content Shard Resolver
 * @description Resolves named text blocks from MDX content by line anchors or
 * heading text.
 *
 * @module lib/utils/contentShardResolver
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import { truncateMdxSource } from '@/lib/md/truncateMdx';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';

/**
 * A single named entry with optional line anchors pointing to its location in
 * the source MDX file.
 *
 * @interface ShardableEntry
 * @property {string} [anchor] - Anchor slug of the rendered heading
 * @property {string} name - Human-readable name used as the shard key
 * @property {number} [startLine] - 1-based start line of the block in the source file
 * @property {number} [endLine] - 1-based end line of the block in the source file
 */
export interface ShardableEntry {
  name: string;
  anchor?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Resolve named text blocks from MDX by line anchor or heading text.
 *
 * @function resolveShards
 * @param {string} content - Full MDX file content
 * @param {ShardableEntry[]} entries - Metadata entries for each block
 * @param {string[]} [keys] - Keys to resolve; all when omitted
 * @returns {Record<string, string>} Map of key to prose text
 */
export function resolveShards(
  content: string,
  entries: ShardableEntry[],
  keys?: string[],
): Record<string, string> {
  const normalised = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');

  const resolveKeys =
    keys && keys.length > 0 ? keys : ['main', ...entries.map((e) => e.name)];

  const result: Record<string, string> = {};

  for (const key of resolveKeys) {
    if (key === 'main') {
      result['main'] = extractMainSection(normalised);
      continue;
    }

    /* Try anchor, then name (fallback for legacy saved characters). */
    const entry =
      entries.find((e) => e.anchor === key) ??
      entries.find((e) => e.name === key) ??
      entries.find((e) => e.anchor === anchorSlug(toPlainMeasure(key)));

    if (entry?.startLine !== undefined && entry?.endLine !== undefined) {
      const block = extractByLineRange(lines, entry.startLine, entry.endLine);
      if (block !== null) {
        result[key] = stripHeadingLine(block);
        continue;
      }
    }

    const block = extractByHeadingText(lines, entry?.name ?? key);
    if (block !== null) {
      result[key] = stripHeadingLine(block);
    }
  }

  return result;
}

/**
 * Return all content that appears before the first `<Collapsible` tag.
 * If the file has no Collapsible components, the entire content is returned.
 *
 * The cut is taken at the block boundary the parser reports, so it can never
 * land inside a construct and leave the caller with source that will not
 * compile.
 *
 * @function extractMainSection
 * @param {string} content - Full normalised MDX content
 * @returns {string} Prose content before the first Collapsible block
 */
function extractMainSection(content: string): string {
  return truncateMdxSource(content, { stopAtComponent: 'Collapsible' }).source;
}

/**
 * Extract lines from the array by 1-based inclusive range.
 *
 * @function extractByLineRange
 * @param {string[]} lines - File lines array
 * @param {number} startLine - 1-based start line (inclusive)
 * @param {number} endLine - 1-based end line (inclusive)
 * @returns {string | null} Extracted text or null when range is invalid
 */
function extractByLineRange(
  lines: string[],
  startLine: number,
  endLine: number,
): string | null {
  if (startLine < 1 || endLine < startLine || endLine > lines.length) {
    return null;
  }
  return lines.slice(startLine - 1, endLine).join('\n');
}

/** Fenced code block delimiter; markup inside one is shown, not parsed. */
const FENCE = /^\s*(?:```|~~~)/;

/** Opening, closing or self-closing MDX component tag. Components only: HTML void
    elements carry no closing tag and would unbalance the count. */
const JSX_TAG = /<(\/?)[A-Z][A-Za-z0-9]*(?:\s[^<>]*?)?(\/?)>/g;

/**
 * Find a heading by case-insensitive text match and extract its block.
 * The block ends immediately before the next heading of the same or higher level,
 * or where an element opened outside the block closes, whichever comes first.
 * Matches exact heading text or a heading suffix (e.g. `"Memorize Spell"` matches
 * `"5th Level – Memorize Spell"`).
 *
 * A heading nested inside a component runs past that component's closing tag on
 * heading level alone, and the extracted source then carries a stray close and
 * fails to compile. Tracking depth stops the block at its enclosing element.
 *
 * @function extractByHeadingText
 * @param {string[]} lines - File lines array
 * @param {string} heading - Heading text to search for (exact or suffix match)
 * @returns {string | null} Extracted heading block text or null when not found
 */
function extractByHeadingText(lines: string[], heading: string): string | null {
  const target = heading.trim().toLowerCase();
  let startIdx = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (!match) continue;
    const text = match[2]
      .replace(/<[^>]+>[^<]*<\/[^>]+>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .toLowerCase();
    if (text === target || text.endsWith(target)) {
      startIdx = i;
      headingLevel = match[1].length;
      break;
    }
  }

  if (startIdx < 0) return null;

  let endIdx = lines.length - 1;
  let depth = 0;
  let fenced = false;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const match = /^(#{1,6})\s+/.exec(line);
    if (match && match[1].length <= headingLevel && depth === 0) {
      endIdx = i - 1;
      break;
    }

    for (const tag of line.matchAll(JSX_TAG)) {
      if (tag[1]) depth--;
      else if (!tag[2]) depth++;
    }

    /* A close with no matching open inside the block means the heading sat
       inside an element that ends here. Carrying on would take that stray
       closing tag along and the extracted source would not compile. */
    if (depth < 0) {
      endIdx = i - 1;
      break;
    }
  }

  while (endIdx > startIdx && lines[endIdx].trim() === '') {
    endIdx--;
  }

  return lines.slice(startIdx, endIdx + 1).join('\n');
}

/**
 * Strip the first line from a block only when it is a Markdown heading line.
 * Bullet-based blocks (e.g. feat features starting with `- **Name.**`) keep their
 * first line.
 *
 * @function stripHeadingLine
 * @param {string} block - Full block text
 * @returns {string} Body without the heading line, or the trimmed block when
 *   the first line is not a heading
 */
function stripHeadingLine(block: string): string {
  const lines = block.split('\n');
  if (lines.length > 0 && /^#{1,6}\s/.test(lines[0])) {
    return lines.slice(1).join('\n').trim();
  }
  return block.trim();
}
