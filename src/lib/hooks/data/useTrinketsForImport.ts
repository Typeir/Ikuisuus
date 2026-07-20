/**
 * @fileoverview Trinkets for Import Hook
 * @description SWR hook for loading trinket metadata from GET /api/trinkets
 * for the Abilities tab import panel.
 *
 * @module lib/hooks/data/useTrinketsForImport
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Options for `useTrinketsForImport`.
 *
 * @interface UseTrinketsForImportOptions
 * @property {string} locale - Content locale
 * @property {boolean} [enabled] - Skip fetch when false
 */
export interface UseTrinketsForImportOptions {
  locale: string;
  enabled?: boolean;
}

/**
 * Result returned by `useTrinketsForImport`.
 *
 * @interface UseTrinketsForImportResult
 * @property {TrinketMetadata[]} trinkets - Loaded records
 * @property {boolean} isLoading - True while request in-flight
 * @property {Error | undefined} error - Error when loading failed
 * @property {KeyedMutator<TrinketMetadata[]>} mutate - SWR mutate
 * @property {() => void} revalidate - Trigger revalidation
 */
export interface UseTrinketsForImportResult {
  trinkets: TrinketMetadata[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<TrinketMetadata[]>;
  revalidate: () => void;
}

/**
 * Fetches all trinkets for the abilities import panel.
 *
 * @param {UseTrinketsForImportOptions} options - Hook configuration
 * @returns {UseTrinketsForImportResult} Trinket loading state
 */
export function useTrinketsForImport({
  locale,
  enabled = true,
}: UseTrinketsForImportOptions): UseTrinketsForImportResult {
  const { data, isLoading, error, mutate } = useSWR<TrinketMetadata[], Error>(
    enabled ? ['trinkets-import', locale] : null,
    () => fetcher<TrinketMetadata[]>(`/api/trinkets?locale=${locale}`),
  );

  return {
    trinkets: data ?? [],
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}
