/**
 * @fileoverview Library Search Component - Debounced local search
 * @description Client-side search component that queries the internal content API
 * (/api/search). Features debounced input, race condition protection, locale-aware
 * routing, and lore-themed empty state messaging.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires next-intl
 * @requires next/link
 * @requires next/navigation
 * @requires @/lib/hooks/useDebounce
 * @requires ./librarySearch.module.scss
 *
 * @example
 * ```tsx
 * import { LibrarySearch } from '@/lib/components/librarySearch/librarySearch';
 *
 * <LibrarySearch />
 * ```
 * @module src/lib/components/librarySearch/librarySearch
 */
'use client';

import { useLibrarySearchData } from '@/lib/hooks/data/useSearchData';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './librarySearch.module.scss';

const SEARCH_LOADING_DELAY_MS = 150;

/**
 * Search component for the Ikuisuus project.
 *
 * Queries the internal `/api/search` endpoint for local library results.
 * Includes debounce input handling, race condition safety, and lore-style
 * fallback messaging.
 *
 * @returns {JSX.Element} The full search UI
 */
export const LibrarySearch = (): JSX.Element => {
  const t = useTranslations('search');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const { results, loading } = useLibrarySearchData(debouncedQuery);
  const [showLoadingText, setShowLoadingText] = useState(false);
  const params = useParams();

  const locale = params.locale as string;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(
        () => setShowLoadingText(true),
        SEARCH_LOADING_DELAY_MS,
      );
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
          <p className='italic text-sm secondary'>{t('noResults')}</p>
        )}

        {debouncedQuery.length < 2 && (
          <p className='italic text-sm secondary'>{t('waiting')}</p>
        )}
      </div>
    </div>
  );
};
