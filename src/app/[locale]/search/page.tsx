/**
 * @fileoverview Search results page at `/{locale}/search?q=...`.
 *
 * @module app/[locale]/search/page
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useSearch } from '@/modules/search/application/useSearch';
import {
  aspectsToFilters,
  filtersToAspects,
  hasFilters,
} from '@/modules/search/domain/aspectFilters';
import { SearchAspectFilters } from '@/modules/search/presentation/AspectFilters/SearchAspectFilters';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { SearchResultList } from '@/modules/search/presentation/SearchResultList/SearchResultList';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { Suspense, useMemo } from 'react';
import styles from './page.module.scss';

/**
 * Inner search page component.
 *
 * @returns {JSX.Element} The search results page
 */
function SearchPageInner(): JSX.Element {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const q = searchParams.get('q') || '';
  const t = useTranslations('search');

  /* Aspect pills link here via repeated `?aspect=damage:fire` params. */
  const aspectKey = searchParams.getAll('aspect').join('\u0000');
  const filters = useMemo(() => aspectsToFilters(aspectKey ? aspectKey.split('\u0000') : []), [
    aspectKey,
  ]);
  const activeAspects = filtersToAspects(filters);
  const filtering = hasFilters(filters);

  const { results, total, loading, error, hasMore, loadMore } = useSearch(
    q,
    locale,
    300,
    filters,
  );

  const hasQuery = q.length >= 2 || filtering;

  return (
    <div className='max-w-3xl px-4 py-8 prose'>
      <h1 className='text-2xl font-semibold mb-6'>
        {hasQuery ? (
          <>
            {q ? (
              <>
                {t('resultsFor')}{' '}
                <span className={styles.resultQueryHighlight}>
                  &ldquo;{q}&rdquo;
                </span>{' '}
              </>
            ) : (
              <>{t('results')} </>
            )}
            <span className={`text-sm ${styles.resultTextSecondary}`}>
              ({total} {t('found')})
            </span>
          </>
        ) : (
          t('ariaLabel')
        )}
      </h1>

      {/* Search bar prefilled from ?q=. */}
      <section className='not-prose mb-6'>
        <SearchBar variant='hero' defaultQuery={q} />
      </section>

      <div className='not-prose'>
        <SearchAspectFilters query={q} active={activeAspects} />
      </div>

      {loading && (
        <p className={`italic text-sm py-4 ${styles.resultTextSecondary}`}>
          {t('searching')}
        </p>
      )}

      {error && (
        <p className={`text-sm py-4 ${styles.resultError}`}>
          {t('unavailable')}
        </p>
      )}

      {!loading && !error && hasQuery && results.length === 0 && (
        <p
          className={`italic text-sm py-8 text-center ${styles.resultTextSecondary}`}>
          {t('noResults')}
        </p>
      )}

      {!hasQuery && (
        <p className={`italic text-sm py-4 ${styles.resultTextSecondary}`}>
          {t('noQuery')}
        </p>
      )}

      {results.length > 0 && (
        <SearchResultList
          results={results}
          hasMore={hasMore}
          loadMore={loadMore}
        />
      )}
    </div>
  );
}

/**
 * Search page.
 *
 * @returns {JSX.Element} The search page
 */
export default function SearchPage(): JSX.Element {
  const t = useTranslations('search');
  return (
    <Suspense
      fallback={
        <div className='max-w-3xl px-4 py-8 prose'>
          <p className={`italic text-sm ${styles.resultTextSecondary}`}>
            {t('loading')}
          </p>
        </div>
      }>
      <SearchPageInner />
    </Suspense>
  );
}
