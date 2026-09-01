/**
 * @fileoverview Scoped Pagefind Search Hook
 * @description Ranks a caller-owned dataset against the Pagefind index: query
 * the shared index (optionally type-filtered), resolve hits to slugs, and
 * intersect with the slugs the caller owns. Embedded surfaces (metadata
 * tables) get the root search's matching — NFC, diacritics, stemming — over
 * data they already hold.
 *
 * @module modules/search/application/useScopedSearch
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useEffect, useRef, useState } from 'react';
import type { SearchContentType } from '../domain/contentTypes';
import { slugOfFragment } from '../infrastructure/mapRecord';
import { searchPagefind } from '../infrastructure/pagefindClient';

/** Minimum query length before the index is asked. */
const MIN_QUERY_LENGTH = 2;

/**
 * Options for {@link useScopedSearch}.
 *
 * @interface ScopedSearchOptions
 * @property {string} locale - Content locale
 * @property {readonly SearchContentType[]} [types] - Restrict the index query to these content types
 * @property {ReadonlySet<string>} [slugs] - Only slugs in this set rank; pass a memoized set
 * @property {number} [debounceMs] - Debounce delay (default 250)
 * @property {number} [limit] - Hits resolved per query (default 120)
 */
export interface ScopedSearchOptions {
  locale: string;
  types?: readonly SearchContentType[];
  slugs?: ReadonlySet<string>;
  debounceMs?: number;
  limit?: number;
}

/**
 * State returned by {@link useScopedSearch}.
 *
 * @interface ScopedSearchState
 * @property {ReadonlyMap<string, number> | null} ranks - Slug mapped to relevance rank (0 best); null when the index cannot answer and the caller should fall back to its own filtering
 * @property {boolean} loading - Whether a query is in flight
 */
export interface ScopedSearchState {
  ranks: ReadonlyMap<string, number> | null;
  loading: boolean;
}

/**
 * Ranks the caller's slugs against the Pagefind index for a term.
 *
 * `ranks` is null for a short term, an unavailable index, or a failed query —
 * the caller keeps its own filtering as the fallback. An empty map is a real
 * answer: nothing matched.
 *
 * @param {string} term - Raw search term, debounced and NFC-normalized internally
 * @param {ScopedSearchOptions} options - Locale, scoping, and tuning
 * @returns {ScopedSearchState} Slug ranks and loading state
 *
 * @example
 * const { ranks } = useScopedSearch(term, { locale, types: ['spells'], slugs: rowSlugs });
 */
export function useScopedSearch(
  term: string,
  options: ScopedSearchOptions,
): ScopedSearchState {
  const { locale, slugs, debounceMs = 250, limit = 120 } = options;
  const typeKey = options.types?.join(',') ?? '';
  const debounced = useDebounce(term, debounceMs);
  const [state, setState] = useState<ScopedSearchState>({
    ranks: null,
    loading: false,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    const query = debounced.trim().normalize('NFC');

    if (query.length < MIN_QUERY_LENGTH) {
      setState({ ranks: null, loading: false });
      return;
    }

    setState((prev) => ({ ranks: prev.ranks, loading: true }));

    void (async () => {
      const response = await searchPagefind(
        locale,
        query,
        typeKey ? { filters: { type: typeKey.split(',') } } : undefined,
      );
      if (requestIdRef.current !== reqId) return;

      if (!response) {
        setState({ ranks: null, loading: false });
        return;
      }

      const hits = response.results.slice(0, limit);
      const fragments = await Promise.all(
        hits.map((hit) => hit.data().catch(() => null)),
      );
      if (requestIdRef.current !== reqId) return;

      const ranks = new Map<string, number>();
      for (const fragment of fragments) {
        if (!fragment) continue;
        const slug = slugOfFragment(fragment);
        if (!slug || ranks.has(slug)) continue;
        if (slugs && !slugs.has(slug)) continue;
        ranks.set(slug, ranks.size);
      }

      setState({ ranks, loading: false });
    })();
  }, [debounced, locale, typeKey, slugs, limit]);

  return state;
}
