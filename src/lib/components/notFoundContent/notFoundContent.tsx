/**
 * @fileoverview Not Found Content Component
 * @description Renders the 404 page and a link to the nearest matching route.
 *
 * @module NotFoundContent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { JSX } from 'react';
import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import { useNearestRoute } from '@/lib/hooks/data/useDraftAndRouteData';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './notFound.module.scss';

/**
 * Renders 404 page with nearest-route suggestion and back-to-library link.
 *
 * @component
 * @returns {JSX.Element} 404 page content
 */
export function NotFoundContent(): JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('notFound');
  const { nearestRoute, loading } = useNearestRoute(pathname);

  return (
    <div className={styles.notFoundContainer}>
      <h1 className={styles.heading}>{t('heading')}</h1>

      <Skeleton className={styles.divider} />

      <h2 className={styles.title}>{t('subtitle')}</h2>

      <Skeleton className={styles.divider} />

      <p className={styles.description}>{t('description')}</p>

      {loading && (
        <div className={styles.skeletonCard}>
          <p className={styles.status}>{t('searchingNearby')}</p>
          <SkeletonGroup>
            <Skeleton variant='text' width='80%' />
            <Skeleton variant='button' width='200px' height='3rem' />
            <Skeleton variant='text' width='40%' />
          </SkeletonGroup>
        </div>
      )}

      {!loading && nearestRoute && (
        <Link href={nearestRoute.path} className={styles.suggestionCard}>
          <span className={styles.suggestionLabel}>{t('didYouMean')}</span>
          <span className={styles.suggestionLink}>
            {nearestRoute.title || nearestRoute.path}
          </span>
          <span className={styles.similarityScore}>
            {t('similarity')}: {Math.round(nearestRoute.similarity * 100)}%
          </span>
        </Link>
      )}

      <Skeleton className={styles.divider} />

      <Link href='/' className={styles.backLink}>
        {t('backToLibrary')}
      </Link>
    </div>
  );
}
