/**
 * @fileoverview Search Data Hooks
 * @description Client hook for local library search.
 * Uses SWR for deduplication and caching.
 *
 * @module lib/hooks/data/useSearchData
 * @author Typeir
 * @version 3.0.0
 * @since 2.0.0
 */

import { librarySearchKey } from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
    fetchLibrarySearchResults,
    type SearchResult,
} from '@/lib/services/api/searchService';
import useSWR from 'swr';

const log = logger.child({ module: 'useSearchData' });

/**
 * State for local library search.
 *
 * @interface LibrarySearchState
 * @property {SearchResult[]} results - Local search results
 * @property {boolean} loading - Whether search request is pending
 */
export interface LibrarySearchState {
  results: SearchResult[];
  loading: boolean;
}

/**
 * Runs local library search using SWR.
 * Returns empty results and loading=false when `query` is shorter than 2 chars.
 *
 * @param {string} query - Debounced query value
 * @returns {LibrarySearchState} Local search state
 */
export function useLibrarySearchData(query: string): LibrarySearchState {
  const { data, isLoading } = useSWR<SearchResult[]>(
    librarySearchKey(query),
    () => fetchLibrarySearchResults(query),
    {
      keepPreviousData: true,
      onError: (error) => {
        log.error('Search error', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  return { results: data ?? [], loading: isLoading };
}
