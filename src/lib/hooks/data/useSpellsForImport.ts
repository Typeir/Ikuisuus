/**
 * @fileoverview Spells for Import Hook
 * @description SWR hook for loading spell metadata for the Abilities tab import
 * panel. Scopes to the character's vocation spell lists when `listSources` is
 * provided; otherwise POSTs /api/spells with no filters (full library).
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
 * @property {string[]} [listSources] - Vocation spell-list names to scope to; when empty/omitted the full library is returned
 */
export interface UseSpellsForImportOptions {
  locale: string;
  enabled?: boolean;
  listSources?: string[];
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
 * Fetches spells for the abilities import panel. When `listSources` is non-empty
 * the results are scoped to those vocation spell lists (merged, deduped); with no
 * sources the full library is returned.
 *
 * @param {UseSpellsForImportOptions} options - Hook configuration
 * @returns {UseSpellsForImportResult} Spell loading state
 */
export function useSpellsForImport({
  locale,
  enabled = true,
  listSources,
}: UseSpellsForImportOptions): UseSpellsForImportResult {
  const sources =
    listSources && listSources.length > 0 ? listSources : undefined;
  const { data, isLoading, error, mutate } = useSWR<SpellMetadata[], Error>(
    enabled ? ['spells-import', locale, sources?.join(',') ?? 'all'] : null,
    () =>
      fetcher<SpellMetadata[]>('/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          sources ? { locale, listSources: sources } : { locale },
        ),
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
