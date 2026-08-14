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
 * Resolves by line range when line anchors are present, else by case-insensitive
 * heading-text match. The heading line is stripped from each result. The key
 * `"main"` returns all content before the first `<Collapsible` tag. If `keys` is
 * empty or omitted, all entries plus `"main"` are resolved.
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
 * Matches exact heading text or a heading suffix (e.g. `"Memorize Spell"` matches
 * `"5th Level – Memorize Spell"`).
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
