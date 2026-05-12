/**
 * @fileoverview Bloodlines Hook
 * @description SWR hook for loading bloodline list from `/api/bloodlines`.
 *
 * @module lib/hooks/data/useBloodlines
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

'use client';

import type { BloodlineApiItem } from '@/lib/types/api.d';
import { bloodlinesKey, urlForBloodlines } from '@/lib/fetch/swrKeys';
import { fetcher } from '@/lib/fetch/fetcher';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Input options for `useBloodlines`.
 *
 * @interface UseBloodlinesOptions
 * @property {string} locale - Content locale (e.g. `'en'`)
 * @property {boolean} [enabled] - Set to `false` to skip fetching (default `true`)
 */
export interface UseBloodlinesOptions {
  locale: string;
  enabled?: boolean;
}

/**
 * Result returned by `useBloodlines`.
 *
 * @interface UseBloodlinesResult
 * @property {BloodlineApiItem[]} bloodlines - Loaded bloodline records
 * @property {boolean} isLoading - True while the request is in-flight
 * @property {Error | undefined} error - Error object when loading failed
 * @property {KeyedMutator<BloodlineApiItem[]>} mutate - SWR mutate for cache invalidation
 */
export interface UseBloodlinesResult {
  bloodlines: BloodlineApiItem[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<BloodlineApiItem[]>;
}

/**
 * Fetches bloodline list from `/api/bloodlines`. Results are cached by SWR
 * so multiple components consuming bloodline data share a single request.
 *
 * @param {UseBloodlinesOptions} options - Hook configuration
 * @returns {UseBloodlinesResult} Bloodline loading state
 */
export function useBloodlines({
  locale,
  enabled = true,
}: UseBloodlinesOptions): UseBloodlinesResult {
  const { data, isLoading, error, mutate } = useSWR<BloodlineApiItem[], Error>(
    bloodlinesKey(locale, enabled),
    () => fetcher<BloodlineApiItem[]>(urlForBloodlines(locale)),
  );

  return {
    bloodlines: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
