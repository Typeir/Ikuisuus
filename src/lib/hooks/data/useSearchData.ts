/**
 * @fileoverview Search Data Hooks
 * @description Client hooks for local and external search.
 * Library search uses SWR for deduplication and caching.
 * External search keeps a 300 ms debounce gate before the SWR key is set.
 *
 * @module lib/hooks/data/useSearchData
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import { librarySearchKey, externalSearchKey } from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
  fetchExternalSearchResults,
  fetchLibrarySearchResults,
  type GoogleSearchResult,
  type SearchResult,
} from '@/lib/services/api/searchService';
import { useEffect, useState } from 'react';
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

/**
 * State for external search.
 *
 * @interface ExternalSearchState
 * @property {GoogleSearchResult[]} results - External result items
 * @property {boolean} loading - Whether search request is pending
 */
export interface ExternalSearchState {
  results: GoogleSearchResult[];
  loading: boolean;
}

/**
 * Runs external search with a 300 ms debounce gate.
 * The internal `useEffect` delays committing the debounced query value;
 * SWR is only invoked after the delay elapses, preserving the timing
 * contract tested by the existing fake-timer suite.
 *
 * @param {string} query - Raw query value (un-debounced)
 * @returns {ExternalSearchState} External search state
 */
export function useExternalSearchData(query: string): ExternalSearchState {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('');
      return;
    }
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data, isLoading } = useSWR<GoogleSearchResult[]>(
    externalSearchKey(debouncedQuery),
    () => fetchExternalSearchResults(debouncedQuery),
    {
      onError: (error) => {
        log.error('External search failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  return { results: data ?? [], loading: isLoading };
}
