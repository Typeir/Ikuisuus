/**
 * @fileoverview Content Shard Hook
 * @description SWR hooks for loading content shards via `/api/shards` and
 * `/api/content-shards/[type]/[slug]`.
 *
 * @module lib/hooks/data/useContentShard
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

'use client';

import { fetcher } from '@/lib/fetch/fetcher';
import {
    contentShardKey,
    contentShardSingleKey,
    urlForContentShard,
    urlForContentShardSingle,
} from '@/lib/fetch/swrKeys';
import type { ContentShardResponse } from '@/lib/types/api.d';
import type { ContentShardType } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import useSWR, { type KeyedMutator } from 'swr';

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
 * Fetches a content shard map from `/api/content-shards/[type]/[slug]`.
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

/**
 * Options for fetching a single named shard via the DB-backed
 * `/api/content-shards/[type]/[slug]?keys[]=` endpoint.
 *
 * @interface UseContentShardSingleOptions
 * @property {string} contentType - API path segment (e.g. `'bloodlines'`, `'feats'`)
 * @property {string} slug - Content item slug
 * @property {string} key - Heading / shard name to fetch
 * @property {string} locale - Content locale
 * @property {boolean} [enabled] - Set to `false` to skip fetching (default `true`)
 */
export interface UseContentShardSingleOptions {
  contentType: string;
  slug: string;
  key: string;
  locale: string;
  enabled?: boolean;
}

/**
 * Fetches a single named shard from the DB-backed
 * `/api/content-shards/[type]/[slug]?keys[]=` endpoint.
 *
 * @param {UseContentShardSingleOptions} options - Hook configuration
 * @returns {UseContentShardResult<ContentShardResponse>} Shard loading state
 */
export function useContentShardSingle({
  contentType,
  slug,
  key,
  locale,
  enabled = true,
}: UseContentShardSingleOptions): UseContentShardResult<ContentShardResponse> {
  const { data, isLoading, error, mutate } = useSWR<
    ContentShardResponse,
    Error
  >(contentShardSingleKey(contentType, slug, key, locale, enabled), () =>
    fetcher<ContentShardResponse>(
      urlForContentShardSingle(contentType, slug, key, locale),
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
