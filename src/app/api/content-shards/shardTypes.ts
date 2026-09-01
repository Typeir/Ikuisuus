/**
 * @fileoverview Content Shard Type Registry
 * @description Maps each route type segment to how its address locates a
 * {@link ShardTarget}. Repository-backed types answer with the record's file
 * and route; the keyword type answers through the producer graph. Adding a
 * type is one registry entry.
 *
 * @module src/app/api/content-shards/shardTypes
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { keywordTarget, type ShardTarget } from '@/lib/md/resolveShardByRef';
import type { ShardableEntry } from '@/lib/utils/contentShardResolver';

/**
 * One shard type the route serves.
 *
 * @interface ShardTypeConfig
 * @property {string} label - Capitalized kind for error strings and logs, e.g. `Vocation`
 * @property {string} shardType - Singular kind echoed in the response, e.g. `vocation`
 * @property {(locale: string, address: string) => Promise<ShardTarget | null>} locate - Resolves the address to a target; null when unknown
 */
export interface ShardTypeConfig {
  label: string;
  shardType: string;
  locate: (locale: string, address: string) => Promise<ShardTarget | null>;
}

/**
 * Builds a repository-backed type: the slug looks up a metadata record, whose
 * `file` and `link` place the target and whose entries come from the record.
 *
 * @template M - Metadata record the lookup returns
 * @param {string} label - Capitalized kind
 * @param {string} shardType - Singular kind echoed in the response
 * @param {(locale: string, slug: string) => Promise<M | null>} getBySlug - Metadata lookup
 * @param {(meta: M) => ShardableEntry[] | undefined} entriesOf - Shardable entries of a record; undefined resolves as empty
 * @returns {ShardTypeConfig} Registry entry
 */
function repositoryType<M extends { file: string; link: string }>(
  label: string,
  shardType: string,
  getBySlug: (locale: string, slug: string) => Promise<M | null>,
  entriesOf: (meta: M) => ShardableEntry[] | undefined,
): ShardTypeConfig {
  return {
    label,
    shardType,
    locate: async (locale, address) => {
      const meta = await getBySlug(locale, address);
      if (!meta) return null;

      return {
        file: meta.file,
        route: meta.link,
        entriesOf: () => entriesOf(meta) ?? [],
      };
    },
  };
}

/**
 * Every type the shard route serves, keyed by its path segment.
 */
export const shardTypeRegistry: Record<string, ShardTypeConfig> = {
  feats: repositoryType(
    'Feat',
    'feat',
    (locale, slug) => featRepository.getBySlug(locale, slug),
    (meta) => meta.features,
  ),
  bloodlines: repositoryType(
    'Bloodline',
    'bloodline',
    (locale, slug) => bloodlineRepository.getBySlug(locale, slug),
    (meta) => meta.boons,
  ),
  vocations: repositoryType(
    'Vocation',
    'vocation',
    (locale, slug) => vocationRepository.getBySlug(locale, slug),
    (meta) => meta.features,
  ),
  specializations: repositoryType(
    'Specialization',
    'specialization',
    (locale, slug) => specializationRepository.getBySlug(locale, slug),
    (meta) => meta.features,
  ),
  keyword: {
    label: 'Keyword',
    shardType: 'keyword',
    locate: (locale, address) => keywordTarget(address, locale),
  },
};
