/**
 * @fileoverview Spells for Import Hook
 * @description SWR hook for loading all spell metadata for the Abilities
 * tab import panel. Uses POST /api/spells with no filters.
 *
 * @module lib/hooks/data/useSpellsForImport
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import { fetcher } from '@/lib/fetch/fetcher';
import useSWR, { type KeyedMutator } from 'swr';

/**
 * Options for `useSpellsForImport`.
 *
 * @interface UseSpellsForImportOptions
 * @property {string} locale - Content locale
 * @property {boolean} [enabled] - Skip fetch when false (default true)
 */
export interface UseSpellsForImportOptions {
  locale: string;
  enabled?: boolean;
}

/**
 * Result returned by `useSpellsForImport`.
 *
 * @interface UseSpellsForImportResult
 * @property {SpellMetadata[]} spells - Loaded spell records
 * @property {boolean} isLoading - True while request in-flight
 * @property {Error | undefined} error - Error when loading failed
 * @property {KeyedMutator<SpellMetadata[]>} mutate - SWR mutate
 * @property {() => void} revalidate - Trigger revalidation
 */
export interface UseSpellsForImportResult {
  spells: SpellMetadata[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<SpellMetadata[]>;
  revalidate: () => void;
}

/**
 * Fetches all spells for the abilities import panel.
 * POST /api/spells with no filters returns full spell list.
 *
 * @param {UseSpellsForImportOptions} options - Hook configuration
 * @returns {UseSpellsForImportResult} Spell loading state
 */
export function useSpellsForImport({
  locale,
  enabled = true,
}: UseSpellsForImportOptions): UseSpellsForImportResult {
  const { data, isLoading, error, mutate } = useSWR<SpellMetadata[], Error>(
    enabled ? ['spells-import', locale] : null,
    () =>
      fetcher<SpellMetadata[]>('/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      }),
  );

  return {
    spells: data ?? [],
    isLoading,
    error,
    mutate,
    revalidate: () => {
      void mutate();
    },
  };
}
