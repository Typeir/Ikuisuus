/**
 * @fileoverview MDX Source Utilities
 * @description Pure client-side utilities for extracting heading blocks from raw
 * MDX content. Mirrors the server-side logic in `/api/shards/route.ts` so the
 * character sheet can shard locally after fetching a source file once, avoiding
 * a per-feature API round-trip.
 *
 * @module lib/utils/mdxSource
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import type { FeatureEntry } from '@/lib/types/vocations';
export type { FeatureEntry } from '@/lib/types/vocations';

/**
 * Extract the text block that starts at `heading` and ends before the next
 * heading of the same or higher level (or EOF). Heading comparison is
 * case-insensitive.
 *
 * @function extractHeadingBlock
 * @param {string} content - Full MDX file content
 * @param {string} heading - Target heading text (without leading `#` characters)
 * @returns {string | null} Full block text including the heading line, or null if not found
 */
export function extractHeadingBlock(
  content: string,
  heading: string,
): string | null {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const target = heading.trim().toLowerCase();

  let startIdx = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (!match) continue;
    if (match[2].trim().toLowerCase() === target) {
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
 * Extract the first non-blank paragraph from a heading block, stripping the
 * heading line itself. Used to pre-populate the `cachedText` preview on a shard.
 *
 * @function extractFirstParagraph
 * @param {string} blockText - Full block text including the heading line
 * @returns {string} First non-blank paragraph, or empty string if none found
 */
export function extractFirstParagraph(blockText: string): string {
  const body = blockText.split('\n').slice(1).join('\n');
  return (
    body
      .split(/\n\n+/)
      .map((p) => p.trim())
      .find((p) => p.length > 0) ?? ''
  );
}

/**
 * Build `CharacterShard[]` from a feature list, pre-populating `cachedText`
 * by extracting heading blocks from the raw MDX source.
 *
 * @function buildShardsFromSource
 * @param {string} slug - Source entity slug, used as the shard ID prefix
 * @param {string} sourceFile - Relative path from `src/content/en/`
 * @param {string} content - Raw MDX file content for local sharding
 * @param {FeatureEntry[]} features - Level–name feature list
 * @param {CharacterShard['category']} category - Shard category tag
 * @returns {CharacterShard[]} Shards with `cachedText` pre-populated where a matching block is found
 */
export function buildShardsFromSource(
  slug: string,
  sourceFile: string,
  content: string,
  features: FeatureEntry[],
  category: CharacterShard['category'],
): CharacterShard[] {
  const normalised = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');
  return features.map((f) => {
    let cachedText: string | undefined;
    if (f.startLine !== undefined && f.endLine !== undefined) {
      const block = lines.slice(f.startLine - 1, f.endLine).join('\n');
      cachedText = extractFirstParagraph(block);
    } else {
      const block = extractHeadingBlock(normalised, f.name);
      cachedText = block ? extractFirstParagraph(block) : undefined;
    }
    return {
      id: `${slug}::${f.level}::${f.name}`,
      sourceFile,
      heading: f.name,
      category,
      level: f.level,
      cachedText,
    };
  });
}

/**
 * Strip the `src/content/en/` prefix from a metadata file path so it is
 * relative to the content root, as expected by `/api/source`.
 *
 * @function stripContentPrefix
 * @param {string} file - Raw file path from metadata
 * @returns {string} Path relative to `src/content/en/`
 */
export function stripContentPrefix(file: string): string {
  return file.replace(/^src\/content\/en\//, '');
}

/**
 * Fetch the raw MDX source for a relative file path from `/api/source`.
 * Returns an empty string on any network or server error.
 *
 * @function fetchSource
 * @param {string} file - Relative path from content root
 * @param {string} locale - Content locale
 * @returns {Promise<string>} Raw MDX text or empty string
 */
export async function fetchSource(
  file: string,
  locale: string,
): Promise<string> {
  try {
    const params = new URLSearchParams({ file, locale });
    const res = await fetch(`/api/source?${params.toString()}`);
    if (!res.ok) return '';
    const data = (await res.json()) as { content?: string };
    return data.content ?? '';
  } catch {
    return '';
  }
}
