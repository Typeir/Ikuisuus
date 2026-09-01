/**
 * @fileoverview Keyword Shards For A Shard Payload
 * @description Resolves the keywords a set of prose shards references, so the
 * character builder gets its definitions with the prose that mentions them.
 *
 * The client compiles these shards in the browser, where there is no index to
 * resolve against. Resolving here is the only place it can happen, and it costs
 * the response nothing the page would not have fetched anyway.
 *
 * Only the references the returned prose writes are resolved. One living inside
 * a resolved shard is left to `/api/keyword-shards`, requested when its card
 * opens.
 *
 * @module src/app/api/content-shards/keywordShards
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { extractKeywordRefs } from '@/lib/md/extractKeywordRefs';
import { resolveShardByRef } from '@/lib/md/resolveShardByRef';
import type { ResolvedShard } from '@/lib/types/api';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:ContentShards:Keywords' });

/**
 * Resolves every keyword the given shards reference, deduplicated by shard id.
 *
 * Failure returns an empty list rather than throwing: a missing definition
 * costs a card, and must not cost the prose it was written in.
 *
 * @param {Record<string, string>} shards - Resolved prose, keyed by shard name
 * @param {string} locale - Content locale
 * @returns {Promise<ResolvedShard[]>} Shards for the keywords that prose writes
 *
 * @example
 * const keywordShards = await keywordShardsFor(shards, 'en');
 * return NextResponse.json({ shardType: 'feat', shards, keywordShards });
 */
export async function keywordShardsFor(
  shards: Record<string, string>,
  locale: string,
): Promise<ResolvedShard[]> {
  const prose = Object.values(shards).filter(Boolean).join('\n\n');
  if (!prose) return [];

  try {
    const resolved = await Promise.all(
      extractKeywordRefs(prose).map((reference) =>
        resolveShardByRef(reference, locale),
      ),
    );

    const unique = new Map<string, ResolvedShard>();
    for (const shard of resolved) {
      if (shard) unique.set(shard.id, shard);
    }

    return [...unique.values()];
  } catch (error) {
    log.warning('Keyword resolution failed for shard payload', {
      locale,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
