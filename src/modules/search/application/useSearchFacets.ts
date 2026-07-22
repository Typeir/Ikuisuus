/**
 * @fileoverview Search Facets Hook
 * @description Returns available filter values with counts from the Pagefind
 * index for a given locale. Used by the facet rail on the `/search` page.
 *
 * Locale-parameterized — no `'en'` literal.
 *
 * @module modules/search/application/useSearchFacets
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useState } from 'react';
import type { SearchFacet, SearchFacetValue } from '../domain/types';
import { getFilters } from '../infrastructure/pagefindClient';

/**
 * State returned by the `useSearchFacets` hook.
 *
 * @interface UseSearchFacetsState
 * @property {SearchFacet[]} facets - Available facets with value counts
 * @property {boolean} loading - Whether the facets request is pending
 * @property {Error | null} error - Error object or null
 */
interface UseSearchFacetsState {
  facets: SearchFacet[];
  loading: boolean;
  error: Error | null;
}

/**
 * Returns available facet values with counts from the Pagefind index.
 *
 * Only fetches once per locale — filters are static for a given index build.
 * SSR-safe — returns empty state until the bundle loads in the browser.
 *
 * @param {string} locale - Locale code
 * @returns {UseSearchFacetsState} Facet state
 */
export function useSearchFacets(locale: string): UseSearchFacetsState {
  const [facets, setFacets] = useState<SearchFacet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      const raw = await getFilters(locale);
      if (cancelled) return;
      if (!raw) {
        setFacets([]);
        setLoading(false);
        return;
      }

      const mapped: SearchFacet[] = Object.entries(raw).map(
        ([field, counts]) => {
          const values: SearchFacetValue[] = Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);

          return { field, label: field, values };
        },
      );

      setFacets(mapped);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) {
        setError(new Error('Failed to load facets'));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { facets, loading, error };
}
