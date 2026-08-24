/**
 * @fileoverview Boon Point arithmetic over selected character shards.
 *
 * @module modules/character-builder/lib/utils/boonPoints
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterShard } from '@/lib/types/character';

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
