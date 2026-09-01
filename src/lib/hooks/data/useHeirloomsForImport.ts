/**
 * @fileoverview Heirlooms for Import Hook
 * @description SWR hook for loading heirloom metadata from GET /api/heirlooms
 * for the Abilities tab import panel.
 *
 * @module lib/hooks/data/useHeirloomsForImport
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import { heirloomsKey } from '@/lib/fetch/swrKeys';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Options for `useHeirloomsForImport`.
 *
 * @interface UseHeirloomsForImportOptions
 * @property {string} locale - Content locale
 * @property {boolean} [enabled] - Skip fetch when false
 */
export interface UseHeirloomsForImportOptions {
  locale: string;
  enabled?: boolean;
}

/**
 * Result returned by `useHeirloomsForImport`.
 *
 * @interface UseHeirloomsForImportResult
 * @property {HeirloomMetadata[]} heirlooms - Loaded records
 * @property {boolean} isLoading - True while request in-flight
 * @property {Error | undefined} error - Error when loading failed
 * @property {KeyedMutator<HeirloomMetadata[]>} mutate - SWR mutate
 * @property {() => void} revalidate - Trigger revalidation
 */
export interface UseHeirloomsForImportResult {
  heirlooms: HeirloomMetadata[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<HeirloomMetadata[]>;
  revalidate: () => void;
}

/**
 * Fetches all heirlooms for the abilities import panel.
 *
 * @param {UseHeirloomsForImportOptions} options - Hook configuration
 * @returns {UseHeirloomsForImportResult} Heirloom loading state
 */
export function useHeirloomsForImport({
  locale,
  enabled = true,
}: UseHeirloomsForImportOptions): UseHeirloomsForImportResult {
  const { data, isLoading, error, mutate } = useSWR<HeirloomMetadata[], Error>(
    heirloomsKey(locale, enabled),
    () => fetcher<HeirloomMetadata[]>(`/api/heirlooms?locale=${locale}`),
  );

  return {
    heirlooms: data ?? [],
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}
