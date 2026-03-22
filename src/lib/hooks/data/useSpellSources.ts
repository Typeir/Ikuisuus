/**
 * @fileoverview Spell Source Data Hook
 * @description Hook for loading spell data from mixed source arrays.
 *
 * @module lib/hooks/data/useSpellSources
 */

import {
  fetchSpellSources,
  type SpellData,
} from '@/lib/services/api/spellSourceService';
import { useEffect, useState } from 'react';

/**
 * Hook result for spell source loading.
 *
 * @interface SpellSourcesState
 * @property {SpellData[]} spellData - Loaded spell records
 * @property {boolean} loading - Loading flag
 * @property {string | null} error - Error message when loading fails
 */
export interface SpellSourcesState {
  spellData: SpellData[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads spells from endpoint and inline sources.
 *
 * @param {(string | SpellData[])[]} sources - Source definitions
 * @param {string} locale - Current locale
 * @param {string[]} [spells] - Optional spell slug filter
 * @param {string} [listSource] - Optional list source filter
 * @returns {SpellSourcesState} Spell loading state
 */
export function useSpellSources(
  sources: (string | SpellData[])[],
  locale: string,
  spells?: string[],
  listSource?: string,
): SpellSourcesState {
  const [spellData, setSpellData] = useState<SpellData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSpellSources({
          sources,
          locale,
          spells,
          listSource,
        });
        if (!cancelled) {
          setSpellData(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load spells',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [listSource, locale, sources, spells]);

  return { spellData, loading, error };
}
