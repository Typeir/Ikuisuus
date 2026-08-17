/**
 * @fileoverview Aspect roll-up and filtering over character shards.
 * @description Pure helpers: count aspects across selected shards, list the
 * aspects present in a picker's items, and test an item against a set of
 * required aspects (every selected aspect must be present).
 *
 * @module modules/character-builder/lib/utils/aspectRollup
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  ASPECT_GROUP_ORDER,
  isInternalAspect,
  parseAspect,
} from '@/modules/library/domain/aspects';

/**
 * One aspect with how many shards carry it.
 *
 * @property {string} aspect - Raw `group:value` token
 * @property {number} count - Number of shards carrying it
 */
export interface AspectCount {
  aspect: string;
  count: number;
}

/**
 * Sort key: vocabulary group order, then value.
 *
 * @param {string} aspect - Raw token
 * @returns {[number, string]} Sortable tuple
 */
function orderKey(aspect: string): [number, string] {
  const parsed = parseAspect(aspect);
  if (!parsed) return [Number.MAX_SAFE_INTEGER, aspect];
  const idx = ASPECT_GROUP_ORDER.indexOf(parsed.group);
  return [idx === -1 ? ASPECT_GROUP_ORDER.length : idx, aspect];
}

/**
 * Counts every displayable aspect across shard tag lists, most frequent
 * first, ties in vocabulary order.
 *
 * @param {Array<string[] | undefined>} tagLists - Tags of each selected shard
 * @returns {AspectCount[]} Counted aspects
 */
export function rollUpAspects(
  tagLists: Array<string[] | undefined>,
): AspectCount[] {
  const counts = new Map<string, number>();
  for (const tags of tagLists) {
    for (const tag of new Set(tags ?? [])) {
      if (isInternalAspect(tag) || !parseAspect(tag)) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([aspect, count]) => ({ aspect, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const [ga, va] = orderKey(a.aspect);
      const [gb, vb] = orderKey(b.aspect);
      return ga - gb || va.localeCompare(vb);
    });
}

/**
 * Distinct displayable aspects present in a list, in vocabulary order.
 *
 * @param {Array<string[] | undefined>} tagLists - Tags of each item
 * @returns {string[]} Aspects available to filter on
 */
export function availableAspects(
  tagLists: Array<string[] | undefined>,
): string[] {
  const seen = new Set<string>();
  for (const tags of tagLists) {
    for (const tag of tags ?? []) {
      if (!isInternalAspect(tag) && parseAspect(tag)) seen.add(tag);
    }
  }
  return [...seen].sort((a, b) => {
    const [ga, va] = orderKey(a);
    const [gb, vb] = orderKey(b);
    return ga - gb || va.localeCompare(vb);
  });
}

/**
 * Whether an item carries every selected aspect. An empty selection matches
 * everything.
 *
 * @param {string[] | undefined} tags - The item's aspects
 * @param {ReadonlySet<string>} selected - Required aspects
 * @returns {boolean} True when the item passes the filter
 */
export function matchesAspects(
  tags: string[] | undefined,
  selected: ReadonlySet<string>,
): boolean {
  if (selected.size === 0) return true;
  if (!tags?.length) return false;
  for (const aspect of selected) if (!tags.includes(aspect)) return false;
  return true;
}
