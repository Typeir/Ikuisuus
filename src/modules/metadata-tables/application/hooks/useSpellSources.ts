/**
 * @fileoverview Spell Source Data Hook
 * @description Hook for loading spell data from mixed source arrays.
 * Uses SWR for caching and deduplication; preserves the initial-load
 * vs. refetching distinction for spinner differentiation.
 *
 * @module lib/hooks/data/useSpellSources
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import type { FilterExpression } from '@/lib/db/content/filters';
import { spellSourcesKey } from '@/lib/fetch/swrKeys';
import {
    fetchSpellSources,
    type SpellData,
} from '@/modules/metadata-tables/infrastructure/api-clients/spellSourceClient';
import useSWR from 'swr';

/**
 * Hook result for spell source loading.
 *
 * @interface SpellSourcesState
 * @property {SpellData[]} spellData - Loaded spell records
 * @property {boolean} loading - True only during the very first load (no data yet)
 * @property {boolean} refetching - True during subsequent fetches (data already present)
 * @property {string | null} error - Error message when loading fails
 */
export interface SpellSourcesState {
  spellData: SpellData[];
  loading: boolean;
  refetching: boolean;
  error: string | null;
}

/**
 * Loads spells from endpoint and inline sources.
 *
 * @param {(string | SpellData[])[]} sources - Source definitions
 * @param {string} locale - Current locale
 * @param {string[]} [spells] - Optional spell slug filter
 * @param {string} [listSource] - Optional list source filter
 * @param {FilterExpression[]} [filters] - Optional repository-side filter list
 * @returns {SpellSourcesState} Spell loading state
 */
export function useSpellSources(
  sources: (string | SpellData[])[],
  locale: string,
  spells?: string[],
  listSource?: string,
  filters?: FilterExpression[],
): SpellSourcesState {
  const filterKey = filters ? JSON.stringify(filters) : '';
  const stableKey = JSON.stringify({ sources, spells, listSource, filterKey });

  const { data, isLoading, isValidating, error } = useSWR<SpellData[], Error>(
    spellSourcesKey(stableKey, locale),
    () =>
      fetchSpellSources({
        sources,
        locale,
        spells,
        listSource,
        filters,
      }),
  );

  const hasData = data !== undefined;

  return {
    spellData: data ?? [],
    loading: isLoading && !hasData,
    refetching: isValidating && hasData,
    error: error ? error.message : null,
  };
}
