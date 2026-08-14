/**
 * @fileoverview Feats Hook
 * @description SWR hook for loading feat metadata from `/api/feats`.
 *
 * @module lib/hooks/data/useFeats
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

'use client';

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import { featsKey, urlForFeats } from '@/lib/fetch/swrKeys';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Input options for `useFeats`.
 *
 * @interface UseFeatsOptions
 * @property {string} locale - Content locale (e.g. `'en'`)
 * @property {boolean} [enabled] - Set to `false` to skip fetching (default `true`)
 */
export interface UseFeatsOptions {
  locale: string;
  enabled?: boolean;
}

/**
 * Result returned by `useFeats`.
 *
 * @interface UseFeatsResult
 * @property {FeatMetadata[]} feats - Loaded feat records (empty array until loaded)
 * @property {boolean} isLoading - True while the request is in-flight
 * @property {Error | undefined} error - Error object when loading failed
 * @property {KeyedMutator<FeatMetadata[]>} mutate - SWR mutate for cache invalidation
 * @property {() => void} revalidate - Triggers a revalidation
 */
export interface UseFeatsResult {
  feats: FeatMetadata[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<FeatMetadata[]>;
  revalidate: () => void;
}

/**
 * Fetches feat metadata from `/api/feats`. Results are cached by SWR per
 * locale key.
 *
 * @param {UseFeatsOptions} options - Hook configuration
 * @returns {UseFeatsResult} Feat loading state
 */
export function useFeats({
  locale,
  enabled = true,
}: UseFeatsOptions): UseFeatsResult {
  const { data, isLoading, error, mutate } = useSWR<FeatMetadata[], Error>(
    featsKey(locale, enabled),
    () => fetcher<FeatMetadata[]>(urlForFeats(locale)),
  );

  return {
    feats: data ?? [],
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}
