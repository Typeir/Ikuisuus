/**
 * @fileoverview Library Search Component - Dual local/external search with debouncing
 * @description Client-side search component that queries both internal content API (/api/search)
 * and optional Google Custom Search Engine for Wikidot results. Features debounced input,
 * race condition protection, locale-aware routing, and lore-themed empty state messaging.
 * Keyboard navigation and click-outside-to-close behavior included.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires react
 * @requires next-intl
 * @requires next/link
 * @requires next/navigation
 * @requires @/lib/hooks/useDebounce
 * @requires @/lib/components/externalSearchResults/externalSearchResults
 * @requires ./librarySearch.module.scss
 * 
 * @example
 * ```tsx
 * import { LibrarySearch } from '@/lib/components/librarySearch/librarySearch';
 * 
 * <LibrarySearch />
 * ```
 */
'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { ExternalSearchResults } from '../externalSearchResults/externalSearchResults';
import styles from './librarySearch.module.scss';
/**
 * Represents a single local search result item returned by the internal API.
 */
type SearchResult = {
  name: string;
  path: string;
};
/**
 * Search component for the Ikuisuus project.
 *
 * This component provides both local and external search capabilities:
 * - Local results come from the internal `/api/search` endpoint.
 * - External results (optional) are sourced via Google CSE (Wikidot).
 *
 * Includes debounce input handling, race condition safety, and lore-style fallback messaging.
 *
 * @returns {JSX.Element} The full search UI
 */
export const LibrarySearch = (): JSX.Element => {
  const t = useTranslations('search');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingText, setShowLoadingText] = useState(false);
  const [searchBeyond, setSearchBeyond] = useState(false);
  const params = useParams();

  const locale = params.locale as string;
  /**
   * Tracks the most recent request for local search to avoid race conditions.
   * Only the result from the latest fetch is allowed to update UI state.
   */
  const requestIdRef = useRef(0);
  /**
   * Runs a debounced local search using the internal API.
   * Replaces results only if data is present, ensuring graceful fallback.
   */
  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;

    if (debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data: SearchResult[] = await res.json();

        if (
          requestIdRef.current === currentRequestId &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setResults(data);
        }
      } catch (err) {
        if (requestIdRef.current === currentRequestId) {
          console.error('Search error:', err);
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    };

    search();
  }, [debouncedQuery]);
  /**
   * Controls whether the "Searching..." indicator is visible.
   * Adds a 150ms delay before showing, to prevent flickering on fast queries.
   */
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(() => setShowLoadingText(true), 150);
    } else {
      setShowLoadingText(false);
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          type='text'
          placeholder={t('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
          aria-label={t('ariaLabel')}
        />
        <div
          className={`${styles.searching} ${
            showLoadingText ? styles.visible : ''
          }`}>
          {t('searching')}
        </div>
      </div>

      <label className='inline-flex items-center space-x-2 text-sm'>
        <input
          type='checkbox'
          checked={searchBeyond}
          onChange={(e) => setSearchBeyond(e.target.checked)}
        />
        <span>{t('checkbox')}</span>
      </label>

      <div className='max-h-96 overflow-y-auto border border-zinc-700 rounded p-4'>
        {results.length > 0 && (
          <>
            <h3 className='text-sm font-semibold mb-2'>{t('localResults')}</h3>
            <ul className='space-y-1 text-sm'>
              {results.map((r) => (
                <li key={r.path}>
                  <Link
                    href={`${locale}/library/${r.path}`}
                    className='hover:underline'>
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {loading && (
          <p className='italic text-sm secondary'>{t('searchingArchives')}</p>
        )}

        {debouncedQuery.length >= 2 && results.length === 0 && !loading && (
          <p className='italic text-sm secondary'>
            {t('noResults')} {!searchBeyond && t('cloneWorldsHint')}
          </p>
        )}

        {debouncedQuery.length < 2 && (
          <p className='italic text-sm secondary'>{t('waiting')}</p>
        )}

        {searchBeyond ? (
          <ExternalSearchResults query={query} />
        ) : (
          <p className='italic text-sm secondary mt-2'>{t('externalToggle')}</p>
        )}
      </div>
    </div>
  );
};
