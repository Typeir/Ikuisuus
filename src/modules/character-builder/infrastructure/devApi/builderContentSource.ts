/**
 * @fileoverview Server-side builder content: the same repository records the builder APIs serve, plus shard prose.
 *
 * @module modules/character-builder/infrastructure/devApi/builderContentSource
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import 'server-only';

import { shardTypeRegistry } from '@/app/api/content-shards/shardTypes';
import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { heirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import { resolveTargetShards } from '@/lib/md/resolveShardByRef';
import type { ResolvedShard } from '@/lib/types/api';
import type {
  BloodlineOption,
  SpecOption,
  VocationOption,
} from '@/lib/types/vocations';

/**
 * Bloodline record with its boon list.
 *
 * @interface BloodlineRecord
 * @property {BloodlineBoon[]} [boons] - Boons, including sub-option children
 */
export interface BloodlineRecord extends BloodlineOption {
  boons?: BloodlineBoon[];
}

/**
 * Shard type the builder resolves prose for.
 *
 * @typedef {'bloodlines'|'vocations'|'specializations'} BuilderShardType
 */
export type BuilderShardType = 'bloodlines' | 'vocations' | 'specializations';

/**
 * Locale-bound, memoized content reader for the dev builder.
 *
 * @interface BuilderContent
 * @property {string} locale - Content locale
 * @property {() => Promise<BloodlineRecord[]>} bloodlines - Bloodline records
 * @property {() => Promise<VocationOption[]>} vocations - Vocation records
 * @property {() => Promise<SpecOption[]>} specializations - Specialization records
 * @property {() => Promise<FeatMetadata[]>} feats - Feat records
 * @property {() => Promise<HeirloomMetadata[]>} heirlooms - Heirloom records
 * @property {() => Promise<TrinketMetadata[]>} trinkets - Trinket records
 * @property {(sources?: string[]) => Promise<SpellMetadata[]>} spells - Spells; scoped to vocation spell lists when sources are given
 * @property {(type: BuilderShardType, slug: string, keys?: string[]) => Promise<ResolvedShard[] | undefined>} shards - Shard prose; undefined on failure
 */
export interface BuilderContent {
  locale: string;
  bloodlines: () => Promise<BloodlineRecord[]>;
  vocations: () => Promise<VocationOption[]>;
  specializations: () => Promise<SpecOption[]>;
  feats: () => Promise<FeatMetadata[]>;
  heirlooms: () => Promise<HeirloomMetadata[]>;
  trinkets: () => Promise<TrinketMetadata[]>;
  spells: (sources?: string[]) => Promise<SpellMetadata[]>;
  shards: (
    type: BuilderShardType,
    slug: string,
    keys?: string[],
  ) => Promise<ResolvedShard[] | undefined>;
}

/**
 * Wraps a loader so it runs once.
 *
 * @function once
 * @template T
 * @param {() => Promise<T>} load - Loader
 * @returns {() => Promise<T>} Memoized loader
 */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | undefined;
  return () => {
    cached ??= load();
    return cached;
  };
}

/**
 * Removes duplicate spells by slug, keeping first-seen order.
 *
 * @function dedupeBySlug
 * @param {SpellMetadata[]} spells - Spells
 * @returns {SpellMetadata[]} Unique spells
 */
function dedupeBySlug(spells: SpellMetadata[]): SpellMetadata[] {
  const bySlug = new Map<string, SpellMetadata>();
  for (const spell of spells) {
    if (!bySlug.has(spell.slug)) bySlug.set(spell.slug, spell);
  }
  return [...bySlug.values()];
}

/**
 * Resolves shard prose for a content address.
 *
 * @async
 * @function loadShards
 * @param {string} locale - Content locale
 * @param {BuilderShardType} type - Shard type
 * @param {string} slug - Content slug
 * @param {string[]} [keys] - Requested shard keys
 * @returns {Promise<ResolvedShard[] | undefined>} Shards; undefined when unresolvable
 */
async function loadShards(
  locale: string,
  type: BuilderShardType,
  slug: string,
  keys?: string[],
): Promise<ResolvedShard[] | undefined> {
  try {
    const target = await shardTypeRegistry[type].locate(locale, slug);
    if (!target) return undefined;
    return (await resolveTargetShards(target, locale, keys)) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Creates a memoized content reader for one locale.
 *
 * @function createBuilderContent
 * @param {string} locale - Content locale
 * @returns {BuilderContent} Content reader
 */
export function createBuilderContent(locale: string): BuilderContent {
  return {
    locale,
    bloodlines: once(
      async () =>
        (await bloodlineRepository.list(locale)) as unknown as BloodlineRecord[],
    ),
    vocations: once(
      async () =>
        (await vocationRepository.list(locale)) as unknown as VocationOption[],
    ),
    specializations: once(
      async () =>
        (await specializationRepository.list(locale)) as unknown as SpecOption[],
    ),
    feats: once(() => featRepository.list(locale)),
    heirlooms: once(() => heirloomRepository.list(locale)),
    trinkets: once(() => trinketRepository.list(locale)),
    spells: async (sources) => {
      if (!sources || sources.length === 0) return spellRepository.list(locale);
      const perSource = await Promise.all(
        sources.map((source) => spellRepository.listBySource(locale, source)),
      );
      return dedupeBySlug(perSource.flat());
    },
    shards: (type, slug, keys) => loadShards(locale, type, slug, keys),
  };
}
