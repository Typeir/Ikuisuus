/**
 * @fileoverview Content Shard Selectors
 * @description Lookups over the `shards` array a content-shard response
 * carries, keyed the way the request addressed them.
 *
 * @module lib/utils/contentShards
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { ResolvedShard } from '@/lib/types/api';

/**
 * The shard answering an addressing key.
 *
 * @param {ResolvedShard[] | undefined} shards - Resolved shards from a response
 * @param {string} key - Addressing key the shard was requested under
 * @returns {ResolvedShard | undefined} The shard, or undefined when absent
 *
 * @example
 * shardFor(data.shards, 'Rage')?.source;
 */
export function shardFor(
  shards: ResolvedShard[] | undefined,
  key: string,
): ResolvedShard | undefined {
  return shards?.find((shard) => shard.key === key);
}

/**
 * The `main` shard — a file's body prose.
 *
 * @param {ResolvedShard[] | undefined} shards - Resolved shards from a response
 * @returns {ResolvedShard | undefined} The main shard, or undefined when absent
 *
 * @example
 * mainShard(data.shards)?.source;
 */
export function mainShard(
  shards: ResolvedShard[] | undefined,
): ResolvedShard | undefined {
  return shardFor(shards, 'main');
}
