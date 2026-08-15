/**
 * @fileoverview Search Hook
 * @description Debounced, race-safe client hook for Pagefind search.
 * Handles loading, empty, and error states; lazy-loads the Pagefind bundle
 * on first query.
 *
 * Pagefind returns hit handles, and resolving one costs a fetch. The hook
 * resolves a page at a time and hands back `loadMore` for the rest, so a broad
 * query reports its full total without paying for every fragment up front.
 *
 * @module modules/search/application/useSearch
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hasFilters, type PagefindFilters } from '../domain/aspectFilters';
import type { SearchQuery, SearchResponse } from '../domain/types';
import { mapPagefindResult } from '../infrastructure/mapRecord';
import {
  searchPagefind,
  type PagefindResult,
} from '../infrastructure/pagefindClient';

/** Minimum query length before search is triggered. */
const MIN_QUERY_LENGTH = 2;

/** Default debounce delay in milliseconds. */
const DEFAULT_DEBOUNCE_MS = 300;

/** Hits resolved per batch. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * State returned by the `useSearch` hook.
 *
 * @interface UseSearchState
 * @property {SearchResponse['results']} results - Resolved results so far
 * @property {number} total - Total hit count, resolved or not
 * @property {boolean} loading - Whether a search is in flight
 * @property {Error | null} error - Error object or null
 * @property {boolean} debouncing - Whether the input is still in the debounce window
 * @property {boolean} hasMore - Whether unresolved hits remain
 * @property {() => void} loadMore - Resolves the next batch of hits
 */
interface UseSearchState {
  results: SearchResponse['results'];
  total: number;
  loading: boolean;
  error: Error | null;
  debouncing: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Resolves a slice of Pagefind hits into domain results.
 *
 * @param {PagefindResult[]} hits - Unresolved hit handles
 * @param {string} locale - Locale the hits were searched in
 * @returns {Promise<SearchResponse['results']>} Mapped results
 */
async function resolveHits(
  hits: PagefindResult[],
  locale: string,
): Promise<SearchResponse['results']> {
  return Promise.all(
    hits.map(async (hit) => mapPagefindResult(await hit.data(), locale)),
  );
}

/**
 * Debounced search hook using the client-side Pagefind bundle.
 *
 * @param {string} term - Raw search term, debounced internally
 * @param {string} locale - Locale code
 * @param {number} [debounceMs=300] - Debounce delay
 * @param {PagefindFilters} [filters] - Aspect filters; a query in their own right
 * @param {number} [pageSize=20] - Hits resolved per batch
 * @returns {UseSearchState} Results, counts, status and the batch loader
 */
export function useSearch(
  term: string,
  locale: string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
  filters?: PagefindFilters,
  pageSize: number = DEFAULT_PAGE_SIZE,
): UseSearchState {
  const debouncedTerm = useDebounce(term, debounceMs);
  const [results, setResults] = useState<SearchResponse['results']>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  /* Unresolved hits for the current request, and how far into them the
     resolved results reach. Held in refs so `loadMore` stays stable and does
     not re-arm the caller's observer on every batch. */
  const hitsRef = useRef<PagefindResult[]>([]);
  const hitLocaleRef = useRef(locale);
  const resolvedRef = useRef(0);
  const loadingMoreRef = useRef(false);

  /* Serialized so a caller building the object inline does not retrigger the
     search on every render. */
  const filterKey = JSON.stringify(filters ?? {});

  const doSearch = useCallback(
    async (
      q: string,
      loc: string,
      reqId: number,
      active: PagefindFilters,
      size: number,
    ): Promise<void> => {
      const filtered = hasFilters(active);

      hitsRef.current = [];
      resolvedRef.current = 0;
      loadingMoreRef.current = false;

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

      const first = Math.min(size, response.results.length);
      const mapped = await resolveHits(response.results.slice(0, first), loc);

      if (requestIdRef.current !== reqId) return;

      hitsRef.current = response.results;
      hitLocaleRef.current = loc;
      resolvedRef.current = first;

      setResults(mapped);
      setTotal(response.results.length);
      setLoading(false);
      setError(null);
    },
    [],
  );

  const loadMore = useCallback((): void => {
    const reqId = requestIdRef.current;
    const hits = hitsRef.current;
    const from = resolvedRef.current;

    if (loadingMoreRef.current || from >= hits.length) return;

    const to = Math.min(from + pageSize, hits.length);
    loadingMoreRef.current = true;
    resolvedRef.current = to;

    resolveHits(hits.slice(from, to), hitLocaleRef.current)
      .then((batch) => {
        if (requestIdRef.current !== reqId) return;
        setResults((prev) => [...prev, ...batch]);
      })
      .catch(() => {
        resolvedRef.current = from;
      })
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [pageSize]);

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    setError(null);
    doSearch(
      debouncedTerm,
      locale,
      reqId,
      JSON.parse(filterKey) as PagefindFilters,
      pageSize,
    ).catch(() => {
      if (requestIdRef.current === reqId) {
        setError(new Error('Search failed'));
        setLoading(false);
      }
    });
  }, [debouncedTerm, locale, doSearch, filterKey, pageSize]);

  return {
    results,
    total,
    loading,
    error,
    debouncing: term !== debouncedTerm,
    hasMore: results.length < total,
    loadMore,
  };
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
