/**
 * @fileoverview Feature Shard Fetcher
 * @description Shared utility for fetching vocation and specialization feature
 * shards from the content-shards API. Generalises the previously duplicated
 * `fetchVocationShards` / `fetchSpecShards` functions from `vocationSelector.tsx`.
 *
 * @module lib/utils/featureShards
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterShard } from '@/lib/types/character';
import type { FeatureEntry } from '@/lib/types/vocations';

/**
 * Strips the `src/content/{locale}/` prefix from a metadata file path,
 * returning the path relative to the content root expected by `/api/shards`.
 *
 * @function stripContentPrefix
 * @param {string} file - Full metadata file path (e.g. `src/content/en/character-creation/vocations/warlock/main.mdx`)
 * @returns {string} Relative path (e.g. `character-creation/vocations/warlock/main.mdx`)
 */
function stripContentPrefix(file: string): string {
  return file.replace(/^src\/content\/[^/]+\//, '');
}

/**
 * Fetches feature shards for a vocation or specialization from
 * `/api/content-shards/{endpoint}/{slug}` and assembles them into
 * {@link CharacterShard} objects ready for `VocationEntry`.
 *
 * Returns an empty array on any fetch or parse failure so callers never
 * need to handle the error case explicitly.
 *
 * @async
 * @function fetchFeatureShards
 * @param {string} slug - Vocation or specialization slug (used in the URL and shard `id`)
 * @param {string} file - Full metadata file path (e.g. `src/content/en/character-creation/vocations/warlock/main.mdx`); used as `sourceFile` on each returned shard so lazy re-fetches resolve to the correct `/api/shards` path
 * @param {FeatureEntry[]} features - Feature list from vocation or specialization metadata
 * @param {'vocation-feature'|'specialization-feature'} category - Shard category tag
 * @param {'vocations'|'specializations'} endpoint - API endpoint segment
 * @param {string} locale - Content locale
 * @returns {Promise<CharacterShard[]>} Resolved feature shards; empty array on error
 */
export async function fetchFeatureShards(
  slug: string,
  file: string,
  features: FeatureEntry[],
  category: 'vocation-feature' | 'specialization-feature',
  endpoint: 'vocations' | 'specializations',
  locale: string,
): Promise<CharacterShard[]> {
  const sourceFile = stripContentPrefix(file);
  try {
    const res = await fetch(
      `/api/content-shards/${endpoint}/${slug}?locale=${locale}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { shards: Record<string, string> };
    return features.map((f) => ({
      id: `${slug}::${f.level}::${f.name}`,
      sourceFile,
      heading: f.name,
      category,
      level: f.level,
      cachedText: data.shards[f.name],
    }));
  } catch {
    return [];
  }
}
