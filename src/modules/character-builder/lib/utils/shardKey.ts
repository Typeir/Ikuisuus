/**
 * @fileoverview Shard identity
 * @description The key a character shard is matched on: the anchor slug of
 * its source feature. Shards saved before anchors existed carry none, so the
 * key is derived from the heading text at read time — the same slug the
 * generator would have stamped — which upgrades old characters lazily and
 * losslessly. Metadata entries resolve their key the same way, so a heading
 * restyle that keeps its slug never orphans a pick.
 *
 * @module modules/character-builder/lib/utils/shardKey
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import type { CharacterShard } from '../../domain/character/characterEntity';

/**
 * Anchor of a heading or feature name.
 *
 * @param {string} text - Heading text or feature name
 * @returns {string} Anchor slug
 */
export function anchorOf(text: string): string {
  return anchorSlug(toPlainMeasure(text));
}

/**
 * Key of a metadata entry: its stamped anchor, else the anchor of its name.
 *
 * @param {{ anchor?: string; heading?: string; name: string }} entry - Boon, feature or option
 * @returns {string} Entry key
 */
export function entryKey(entry: {
  anchor?: string;
  heading?: string;
  name: string;
}): string {
  return entry.anchor ?? anchorOf(entry.heading ?? entry.name);
}

/**
 * Key of a saved shard: its stored anchor, else the anchor of its heading.
 *
 * @param {Pick<CharacterShard, 'key' | 'heading'>} shard - Character shard
 * @returns {string} Shard key
 */
export function shardKey(shard: Pick<CharacterShard, 'key' | 'heading'>): string {
  return shard.key ?? anchorOf(shard.heading);
}

/**
 * Whether a shard is the pick of a metadata entry.
 *
 * @param {Pick<CharacterShard, 'key' | 'heading'>} shard - Character shard
 * @param {{ anchor?: string; heading?: string; name: string }} entry - Metadata entry
 * @returns {boolean} True when they share a key
 */
export function shardIs(
  shard: Pick<CharacterShard, 'key' | 'heading'>,
  entry: { anchor?: string; heading?: string; name: string },
): boolean {
  return shardKey(shard) === entryKey(entry);
}
