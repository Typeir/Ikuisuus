/**
 * @fileoverview Featured Discovery Grid
 * @description Home-page featured area. Fetches the daily discovery set from
 * `/api/discovery` client-side (after mount — server markup is a stable
 * loading state, so no hydration mismatch) and renders one featured card per
 * content type.
 *
 * @module modules/search/presentation/FeaturedGrid/FeaturedGrid
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton';
import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  localizeLink,
  SEARCH_CONTENT_TYPES,
  type SearchContentType,
  type SearchResult,
} from '../../domain';
import { SearchResultRow } from '../SearchResultRow/SearchResultRow';
import styles from './FeaturedGrid.module.scss';

/** Shape of a discovery entry from /api/discovery. */
interface DiscoveryEntry {
  slug: string;
  title: string;
  link: string;
  description?: string;
  image?: string;
  readingTime?: string;
  type: string;
}

/**
 * Props for the FeaturedGrid component.
 *
 * @interface FeaturedGridProps
 * @property {string} locale - Current locale code
 */
interface FeaturedGridProps {
  locale: string;
}

/**
 * Renders the "featured" discovery section: heading, loading/empty states,
 * and a card grid with one daily-featured entry per content type.
 *
 * @param {FeaturedGridProps} props - Component props
 * @returns {JSX.Element} The featured section
 */
export function FeaturedGrid({ locale }: FeaturedGridProps): JSX.Element {
  const t = useTranslations('archive');
  const [featured, setFeatured] = useState<
    Record<string, DiscoveryEntry | null>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/discovery?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const entries: Record<string, DiscoveryEntry | null> = {};
        for (const [type, set] of Object.entries(data.entries || {}) as [
          string,
          { featured: DiscoveryEntry | null },
        ][]) {
          entries[type] = set.featured;
        }
        setFeatured(entries);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const types = Object.keys(featured);

  return (
    <section className='py-6'>
      <h2 className='text-lg font-semibold mb-4'>{t('featuredHeading')}</h2>

      {loading && (
        <>
          <p className='sr-only' role='status'>
            {t('featuredLoading')}
          </p>
          {/* One skeleton card per content type — same grid as the data.
              Mirrors the card anatomy: 24px sigil beside a content column
              of type label, title, and description lines. */}
          <div
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 not-prose'
            aria-hidden='true'>
            {SEARCH_CONTENT_TYPES.map((type) => (
              <div key={type} className={styles.skeletonCard}>
                <Skeleton variant='card' width='24px' height='24px' />
                <div className={styles.skeletonCardContent}>
                  <Skeleton variant='text' width='35%' height='0.625rem' />
                  <Skeleton variant='text' width='70%' height='0.9375rem' />
                  <Skeleton variant='text' width='100%' height='0.75rem' />
                  <Skeleton variant='text' width='55%' height='0.75rem' />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && types.length === 0 && (
        <p className={cn('italic text-sm', styles.featuredEmpty)}>
          {t('featuredEmpty')}
        </p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 not-prose'>
        {types.map((type) => {
          const entry = featured[type];
          if (!entry) return null;
          const result: SearchResult = {
            record: {
              id: `${type}:${locale}:${entry.slug}`,
              type: type as SearchContentType,
              locale,
              slug: entry.slug,
              title: entry.title,
              link: localizeLink(entry.link, locale),
              description: entry.description,
              image: entry.image,
              meta: entry.readingTime
                ? { readingTime: entry.readingTime }
                : undefined,
            },
            score: 0,
            snippet: entry.description || '',
            matchedFields: [],
          };
          return <SearchResultRow key={type} result={result} variant='card' />;
        })}
      </div>
    </section>
  );
}
