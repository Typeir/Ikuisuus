/**
 * @fileoverview Content Shard Hook
 * @description SWR hooks for loading content shards via `/api/shards` and
 * `/api/content-shards/[type]/[slug]`. Provides a unified interface covering
 * both lazy-expand and eager-load patterns.
 *
 * @module lib/hooks/data/useContentShard
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

'use client';

import type { ContentShardType } from '@/lib/components/characterSheet/shards/contentShardPanel';
import { fetcher } from '@/lib/fetch/fetcher';
import {
    contentShardKey,
    shardKey,
    urlForContentShard,
    urlForShard,
} from '@/lib/fetch/swrKeys';
import type { ContentShardResponse, ShardResponse } from '@/lib/types/api.d';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Options for the `/api/shards` (single heading) variant.
 *
 * @interface UseShardOptions
 * @property {string} sourceFile - Source file slug
 * @property {string} heading - Heading key within the file
 * @property {boolean} [enabled] - Set to `false` to skip fetching (default `true`)
 */
export interface UseShardOptions {
  sourceFile: string;
  heading: string;
  enabled?: boolean;
}

/**
 * Options for the `/api/content-shards/[type]/[slug]` variant.
 *
 * @interface UseContentShardOptions
 * @property {ContentShardType} contentType - API path segment (e.g. `'feats'`)
 * @property {string} slug - Content item slug
 * @property {string} locale - Content locale
 * @property {boolean} [enabled] - Set to `false` to skip fetching (default `true`)
 */
export interface UseContentShardOptions {
  contentType: ContentShardType;
  slug: string;
  locale: string;
  enabled?: boolean;
}

/**
 * Generic shard result shape.
 *
 * @template T
 * @interface UseContentShardResult
 * @property {T | undefined} data - Response data when loaded
 * @property {boolean} isLoading - True while the request is in-flight
 * @property {Error | undefined} error - Error when loading failed
 * @property {KeyedMutator<T>} mutate - SWR mutate for cache invalidation
 * @property {() => void} revalidate - Convenience revalidation trigger
 */
export interface UseContentShardResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<T>;
  revalidate: () => void;
}

/**
 * Fetches a single heading block from `/api/shards`. The key is `null` until
 * `enabled` becomes truthy, implementing the lazy-expand pattern used by
 * `ShardDisplay`.
 *
 * @param {UseShardOptions} options - Hook configuration
 * @returns {UseContentShardResult<ShardResponse>} Shard loading state
 */
export function useShard({
  sourceFile,
  heading,
  enabled = true,
}: UseShardOptions): UseContentShardResult<ShardResponse> {
  const { data, isLoading, error, mutate } = useSWR<ShardResponse, Error>(
    shardKey(sourceFile, heading, enabled),
    () => fetcher<ShardResponse>(urlForShard(sourceFile, heading)),
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}

/**
 * Fetches a content shard map from `/api/content-shards/[type]/[slug]`. Used
 * by `ContentShardPanel` for eager full-page body loading.
 *
 * @param {UseContentShardOptions} options - Hook configuration
 * @returns {UseContentShardResult<ContentShardResponse>} Content shard loading state
 */
export function useContentShard({
  contentType,
  slug,
  locale,
  enabled = true,
}: UseContentShardOptions): UseContentShardResult<ContentShardResponse> {
  const { data, isLoading, error, mutate } = useSWR<
    ContentShardResponse,
    Error
  >(contentShardKey(contentType, slug, locale, enabled), () =>
    fetcher<ContentShardResponse>(
      urlForContentShard(contentType, slug, locale),
    ),
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}
