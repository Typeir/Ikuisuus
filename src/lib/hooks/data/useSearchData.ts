/**
 * @fileoverview Search Data Hooks
 * @description Client hooks for local and external search with race control.
 *
 * @module lib/hooks/data/useSearchData
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import {
  fetchExternalSearchResults,
  fetchLibrarySearchResults,
  type GoogleSearchResult,
  type SearchResult,
} from '@/lib/services/api/searchService';
import { useEffect, useRef, useState } from 'react';

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
 * Runs local search with request ordering protection.
 *
 * @param {string} query - Debounced query value
 * @returns {LibrarySearchState} Local search state
 */
export function useLibrarySearchData(query: string): LibrarySearchState {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchLibrarySearchResults(query);
        if (
          requestIdRef.current === currentRequestId &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setResults(data);
        }
      } catch (error) {
        if (requestIdRef.current === currentRequestId) {
          log.error('Search error', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    };

    run();
  }, [query]);

  return { results, loading };
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
 * Runs external search with debounce and race condition control.
 *
 * @param {string} query - Raw query value
 * @returns {ExternalSearchState} External search state
 */
export function useExternalSearchData(query: string): ExternalSearchState {
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;

    if (query.length < 2) {
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchExternalSearchResults(query);
        if (requestIdRef.current === currentRequestId && data.length > 0) {
          setResults(data);
        }
      } catch (error) {
        if (requestIdRef.current === currentRequestId) {
          log.error('External search failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return { results, loading };
}
