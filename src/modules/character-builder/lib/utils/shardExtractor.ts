/**
 * @fileoverview Shard Extractor Utility
 * @description Client-side helper that fetches a named MDX heading block from
 * the `/api/shards` endpoint and assembles it into a `CharacterShard`. Also
 * provides a pure helper for computing total Boon Points spent.
 *
 * @module modules/character-builder/lib/utils/shardExtractor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterShard } from '@/lib/types/character';

/**
 * Shape of the `/api/shards` JSON response.
 *
 * @interface ShardApiResponse
 * @property {number} startLine - 1-based start line of the block
 * @property {number} endLine - 1-based end line of the block
 * @property {string} text - Raw text of the block including the heading line
 */
interface ShardApiResponse {
  startLine: number;
  endLine: number;
  text: string;
}

/**
 * Options for `fetchShard`.
 *
 * @interface FetchShardOptions
 * @property {string} sourceFile - Relative path from `src/content/en/`
 * @property {string} heading - Exact heading text to look up (case-insensitive)
 * @property {CharacterShard['category']} category - Shard category tag
 * @property {number} [bpCost] - Boon Point cost (for boon shards)
 * @property {number} [level] - Minimum level (for feature shards)
 */
export interface FetchShardOptions {
  sourceFile: string;
  heading: string;
  category: CharacterShard['category'];
  bpCost?: number;
  level?: number;
}

/**
 * Fetch a named heading block from the `/api/shards` endpoint and build a
 * `CharacterShard` with the first non-blank paragraph cached in `cachedText`.
 *
 * @function fetchShard
 * @param {FetchShardOptions} options - Shard fetch options
 * @returns {Promise<CharacterShard>} Resolved shard with `cachedText` populated
 * @throws {Error} When the API returns an error status
 */
export async function fetchShard(
  options: FetchShardOptions,
): Promise<CharacterShard> {
  const params = new URLSearchParams({
    file: options.sourceFile,
    heading: options.heading,
  });
  const res = await fetch(`/api/shards?${params.toString()}`);
  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => ({ error: 'Unknown error' }))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ShardApiResponse;

  const firstParagraph = data.text.split('\n').slice(1).join('\n').trim();

  return {
    id: `${options.sourceFile}::${options.heading}`,
    sourceFile: options.sourceFile,
    heading: options.heading,
    category: options.category,
    bpCost: options.bpCost,
    level: options.level,
    cachedText: firstParagraph,
  };
}

/**
 * Compute the total Boon Points spent across all selected boon shards.
 * Non-boon shards and shards with no `bpCost` are counted as 0.
 *
 * @function computeBpSpent
 * @param {CharacterShard[]} selectedBoons - Array of selected boon shards
 * @returns {number} Total BP spent
 */
export function computeBpSpent(selectedBoons: CharacterShard[]): number {
  return selectedBoons.reduce(
    (sum, shard) => sum + (shard.category === 'boon' ? (shard.bpCost ?? 0) : 0),
    0,
  );
}
