/**
 * @fileoverview Search Hook
 * @description Debounced, race-safe client hook for Pagefind search. Uses
 * the existing `useDebounce` utility from the project. Handles loading,
 * empty, and error states. Pagefind bundle is lazy-loaded on first query.
 *
 * Locale-parameterized — no `'en'` literal.
 *
 * @module modules/search/application/useSearch
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hasFilters, type PagefindFilters } from '../domain/aspectFilters';
import type { SearchQuery, SearchResponse } from '../domain/types';
import { mapPagefindResult } from '../infrastructure/mapRecord';
import { searchPagefind } from '../infrastructure/pagefindClient';

/** Minimum query length before search is triggered. */
const MIN_QUERY_LENGTH = 2;

/** Default debounce delay in milliseconds. */
const DEFAULT_DEBOUNCE_MS = 300;

/**
 * State returned by the `useSearch` hook.
 *
 * @interface UseSearchState
 * @property {SearchResponse['results']} results - Current search results
 * @property {number} total - Total result count
 * @property {boolean} loading - Whether a search is in flight
 * @property {Error | null} error - Error object or null
 * @property {boolean} debouncing - Whether the input is still in the debounce window
 */
interface UseSearchState {
  results: SearchResponse['results'];
  total: number;
  loading: boolean;
  error: Error | null;
  debouncing: boolean;
}

/**
 * Debounced search hook using the client-side Pagefind bundle.
 */
export function useSearch(
  term: string,
  locale: string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
  filters?: PagefindFilters,
): UseSearchState {
  const debouncedTerm = useDebounce(term, debounceMs);
  const [results, setResults] = useState<SearchResponse['results']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  /* Serialized so a caller building the object inline does not retrigger the
     search on every render. */
  const filterKey = JSON.stringify(filters ?? {});

  const doSearch = useCallback(
    async (
      q: string,
      loc: string,
      reqId: number,
      active: PagefindFilters,
    ): Promise<void> => {
      const filtered = hasFilters(active);

      /* A filter is a query in its own right, so the minimum length applies
         only when there is nothing else to search by. */
      if (q.length < MIN_QUERY_LENGTH && !filtered) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      const response = await searchPagefind(
        loc,
        q,
        filtered ? { filters: active } : undefined,
      );

      if (requestIdRef.current !== reqId) return;

      if (!response) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        setError(new Error('Search unavailable — check console for details'));
        return;
      }

      const dataFutures = response.results.map(async (r) => {
        const fragment = await r.data();
        return mapPagefindResult(fragment, loc);
      });

      const mapped = await Promise.all(dataFutures);

      if (requestIdRef.current !== reqId) return;

      setResults(mapped);
      setTotal(mapped.length);
      setLoading(false);
      setError(null);
    },
    [],
  );

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    setError(null);
    doSearch(
      debouncedTerm,
      locale,
      reqId,
      JSON.parse(filterKey) as PagefindFilters,
    ).catch(() => {
      if (requestIdRef.current === reqId) {
        setError(new Error('Search failed'));
        setLoading(false);
      }
    });
  }, [debouncedTerm, locale, doSearch, filterKey]);

  return { results, total, loading, error, debouncing: term !== debouncedTerm };
}

/**
 * Builds a `SearchQuery` from the hook's parameters.
 *
 * @param {string} term - Search term
 * @param {string} locale - Locale code
 * @returns {SearchQuery} Typed query object
 */
export function toSearchQuery(term: string, locale: string): SearchQuery {
  return { term, locale };
}
