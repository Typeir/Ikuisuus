/**
 * @fileoverview Content Shard Resolver
 * @description Server-side utility that extracts named text blocks from MDX content
 * files. Given metadata with optional line anchors and raw MDX text, resolves each
 * requested key to its full prose body.
 *
 * This module is intended for use only in server-side API routes. It has no
 * dependency on Next.js request/response types and can be unit-tested in isolation.
 *
 * @module lib/utils/contentShardResolver
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * A single named entry with optional line anchors pointing to its location in
 * the source MDX file.
 *
 * @interface ShardableEntry
 * @property {string} name - Human-readable name used as the shard key
 * @property {number} [startLine] - 1-based start line of the block in the source file
 * @property {number} [endLine] - 1-based end line of the block in the source file
 */
export interface ShardableEntry {
  name: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Resolve a named set of shards from raw MDX content.
 *
 * Each requested key is looked up in `entries` to obtain optional line anchors.
 * When anchors are present the text is sliced by line range and the heading line
 * is stripped. When anchors are absent the function falls back to a
 * case-insensitive heading-text search. The special key `"main"` returns all
 * content that appears before the first `<Collapsible` tag.
 *
 * If `keys` is empty or omitted all entries plus `"main"` are resolved.
 *
 * @function resolveShards
 * @param {string} content - Full MDX file content
 * @param {ShardableEntry[]} entries - Metadata entries for each named block
 * @param {string[]} [keys] - Specific keys to resolve; resolves all when omitted
 * @returns {Record<string, string>} Map from key name to resolved prose text
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

    const entry = entries.find((e) => e.name === key);

    if (entry?.startLine !== undefined && entry?.endLine !== undefined) {
      const block = extractByLineRange(lines, entry.startLine, entry.endLine);
      if (block !== null) {
        result[key] = stripHeadingLine(block);
        continue;
      }
    }

    const block = extractByHeadingText(lines, key);
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
 * @function extractMainSection
 * @param {string} content - Full normalised MDX content
 * @returns {string} Prose content before the first Collapsible block
 */
function extractMainSection(content: string): string {
  const idx = content.indexOf('<Collapsible');
  return (idx === -1 ? content : content.slice(0, idx)).trim();
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

/**
 * Find a heading by case-insensitive text match and extract its block.
 * The block ends immediately before the next heading of the same or higher level.
 *
 * Accepts both exact matches and suffix matches so that a feature stored as
 * `"Memorize Spell"` resolves against a heading like `"5th Level – Memorize Spell"`.
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
  for (let i = startIdx + 1; i < lines.length; i++) {
    const match = /^(#{1,6})\s+/.exec(lines[i]);
    if (match && match[1].length <= headingLevel) {
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
 * Strip the first line from a block (the heading line itself) and return the
 * trimmed prose body.
 *
 * @function stripHeadingLine
 * @param {string} block - Full heading block including the heading line
 * @returns {string} Prose body without the heading line
 */
function stripHeadingLine(block: string): string {
  return block.split('\n').slice(1).join('\n').trim();
}
