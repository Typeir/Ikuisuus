/**
 * @fileoverview Boon Selection Helpers
 * @description Pure functions computing the next selected-boon shard array when a
 * variable-cost boon's sub-option is toggled.
 *
 * @module lib/components/characterSheet/builder/boonSelection
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import { entryKey, shardIs } from '../../lib/utils/shardKey';
import type { CharacterShard } from '@/lib/types/character';

/**
 * Computes the next selected-boon array after toggling a sub-option of a
 * variable-cost boon. `choose-one` replaces the choice; `pick-any` toggles the
 * option in/out. Empty result removes the boon. `bpCost` is the summed cost of
 * the chosen options.
 *
 * @param {CharacterShard[]} selectedBoons - Current selection
 * @param {BloodlineBoon} boon - The boon whose sub-option changed
 * @param {string} optionName - The toggled sub-option name
 * @param {string} bloodlineSlug - Active bloodline slug, used for a new shard's id/source
 * @returns {CharacterShard[]} Next selection
 */
export function applySubOptionSelection(
  selectedBoons: CharacterShard[],
  boon: BloodlineBoon,
  optionName: string,
  bloodlineSlug: string,
): CharacterShard[] {
  const options = boon.subOptions ?? [];
  const mode = boon.subOptionMode ?? 'choose-one';
  const existing = selectedBoons.find((s) => shardIs(s, boon));
  const current = existing?.selectedSubOptions ?? [];

  let next: string[];
  if (mode === 'pick-any') {
    next = current.includes(optionName)
      ? current.filter((name) => name !== optionName)
      : [...current, optionName];
  } else {
    next = [optionName];
  }

  if (next.length === 0) {
    return selectedBoons.filter((s) => !shardIs(s, boon));
  }

  const bpCost = next.reduce(
    (sum, name) =>
      sum + (options.find((option) => option.name === name)?.bpValue ?? 0),
    0,
  );
  const tags = pickedOptionTags(boon, next);

  if (existing) {
    return selectedBoons.map((s) =>
      shardIs(s, boon)
        ? { ...s, bpCost, selectedSubOptions: next, tags }
        : s,
    );
  }

  const shard: CharacterShard = {
    id: `${bloodlineSlug}::${boon.name}`,
    sourceFile: `character-creation/bloodlines/${bloodlineSlug}.bloodline.mdx`,
    heading: boon.name,
    key: entryKey(boon),
    category: 'boon',
    bpCost,
    selectedSubOptions: next,
    tags,
  };
  return [...selectedBoons, shard];
}

/**
 * Aspects of the picked options, unioned in option order. Falls back to the
 * boon's own roll-up when no option carries tags of its own (older sidecars).
 *
 * @param {BloodlineBoon} boon - The multichoice boon
 * @param {string[]} picked - Names of the picked options
 * @returns {string[] | undefined} Tags for the shard
 */
export function pickedOptionTags(
  boon: BloodlineBoon,
  picked: string[],
): string[] | undefined {
  const options = boon.subOptions ?? [];
  if (!options.some((option) => option.tags?.length)) return boon.tags;
  const union = new Set<string>();
  for (const name of picked) {
    for (const tag of options.find((option) => option.name === name)?.tags ?? []) {
      union.add(tag);
    }
  }
  return [...union];
}

/**
 * SWR handles a picker needs to warm a boon's prose into its shard.
 *
 * @property {{ get: (key: string) => { data?: unknown } | undefined }} cache - SWR cache
 * @property {(key: string, fetcher: Promise<unknown>, opts: { revalidate: boolean; populateCache: boolean }) => Promise<unknown>} mutate - SWR mutate
 */
export interface ShardCacheHandles {
  cache: { get: (key: string) => { data?: unknown } | undefined };
  mutate: (
    key: string,
    fetcher: Promise<unknown>,
    opts: { revalidate: boolean; populateCache: boolean },
  ) => Promise<unknown>;
}

/**
 * Builds the shard for a plain (single-cost) boon, warming its prose from
 * the content-shards API by anchor when it can; the body stays lazy on failure.
 *
 * @param {BloodlineBoon} boon - The boon being picked
 * @param {string} bloodlineSlug - Bloodline slug
 * @param {string} locale - Content locale
 * @param {ShardCacheHandles} swr - SWR cache handles
 * @returns {Promise<CharacterShard>} The new shard
 */
export async function buildBoonShard(
  boon: BloodlineBoon,
  bloodlineSlug: string,
  locale: string,
  swr: ShardCacheHandles,
): Promise<CharacterShard> {
  const key = entryKey(boon);
  const url = `/api/content-shards/bloodlines/${bloodlineSlug}?keys[]=${encodeURIComponent(key)}&locale=${locale}`;
  type BoonShardResponse = { shards: Record<string, string> };
  let cachedText: string | undefined;
  const cached = swr.cache.get(url)?.data as BoonShardResponse | undefined;
  if (cached) {
    cachedText = cached.shards[key];
  } else {
    try {
      const data = (await swr.mutate(url, fetcher<BoonShardResponse>(url), {
        revalidate: false,
        populateCache: true,
      })) as BoonShardResponse | undefined;
      cachedText = data?.shards[key];
    } catch {
      /* stays undefined; the card fetches lazily on expand */
    }
  }
  return {
    id: `${bloodlineSlug}::${boon.name}`,
    sourceFile: `character-creation/bloodlines/${bloodlineSlug}.bloodline.mdx`,
    heading: boon.name,
    key,
    category: 'boon',
    bpCost: boon.bpValue,
    cachedText,
    tags: boon.tags,
  };
}
