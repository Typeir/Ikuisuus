/**
 * @fileoverview Search Results Page
 * @description Full search results page at `/{locale}/search?q=...`.
 * Client component — Pagefind is client-only. Binds useSearch + SearchResultRow.
 * Query from URL params. Minimal T7 for v1; FacetRail deferred.
 *
 * @module app/[locale]/search/page
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useSearch } from '@/modules/search/application/useSearch';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { SearchResultRow } from '@/modules/search/presentation/SearchResultRow/SearchResultRow';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { Suspense } from 'react';
import styles from './page.module.scss';

/**
 * Inner search page component (consumes useSearchParams).
 *
 * @returns {JSX.Element} The search results page
 */
function SearchPageInner(): JSX.Element {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const q = searchParams.get('q') || '';
  const t = useTranslations('search');

  const { results, total, loading, error } = useSearch(q, locale);

  const hasQuery = q.length >= 2;

  return (
    <div className='max-w-3xl px-4 py-8 prose'>
      <h1 className='text-2xl font-semibold mb-6'>
        {hasQuery ? (
          <>
            {t('resultsFor')}{' '}
            <span className={styles.resultQueryHighlight}>
              &ldquo;{q}&rdquo;
            </span>{' '}
            <span className={`text-sm ${styles.resultTextSecondary}`}>
              ({total} {t('found')})
            </span>
          </>
        ) : (
          t('ariaLabel')
        )}
      </h1>

      {/* The page owns a search bar too — prefilled from ?q= and re-synced
          when the param changes, so refining a query doesn't require the
          sidebar. */}
      <section className='not-prose mb-6'>
        <SearchBar variant='hero' defaultQuery={q} />
      </section>

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
        <div className='flex flex-col gap-1 not-prose'>
          {results.map((result) => (
            <SearchResultRow key={result.record.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Search results page — wraps inner component in Suspense for useSearchParams.
 *
 * @returns {JSX.Element} The search page
 */
export default function SearchPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className='max-w-3xl px-4 py-8 prose'>
          <p className={`italic text-sm ${styles.resultTextSecondary}`}>
            Loading search…
          </p>
        </div>
      }>
      <SearchPageInner />
    </Suspense>
  );
}
