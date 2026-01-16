/**
 * @fileoverview Not Found Content Component
 * @description 404 page with smart route suggestion using nearest match algorithm
 * 
 * @module NotFoundContent
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import { ApiRoutes } from '@/lib/enums/apiRoutes';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './notFound.module.scss';

/**
 * Route match result from API
 * 
 * @interface RouteMatch
 * @property {string} path - Matched route path
 * @property {string} [title] - Display title for route
 * @property {number} similarity - Similarity score (0-1)
 */
interface RouteMatch {
  path: string;
  title?: string;
  similarity: number;
}

/**
 * Not Found content component with smart suggestions
 * 
 * @component
 * @returns {JSX.Element} 404 page content
 */
export function NotFoundContent(): JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('notFound');
  const [nearestRoute, setNearestRoute] = useState<RouteMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function findMatch() {
      try {
        const response = await fetch(ApiRoutes.FindNearestRoute, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathname })
        });
        
        if (response.ok) {
          const data = await response.json();
          setNearestRoute(data.match);
        }
      } catch (err) {
        console.error('Failed to find nearest route:', err);
      } finally {
        setLoading(false);
      }
    }

    if (pathname) {
      findMatch();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  return (
    <div className={styles.notFoundContainer}>
      <h1 className={styles.heading}>{t('heading')}</h1>
      <h2 className={styles.title}>{t('subtitle')}</h2>
      <p className={styles.description}>{t('description')}</p>
      
      {loading && (
        <div className={styles.skeletonCard}>
          <SkeletonGroup>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="button" width="200px" height="3rem" />
            <Skeleton variant="text" width="40%" />
          </SkeletonGroup>
        </div>
      )}
      
      {!loading && nearestRoute && (
          <Link href={nearestRoute.path} >
        <div className={styles.suggestionCard}>
          <p className={styles.suggestionLabel}>{t('didYouMean')}</p>
          <p className={styles.suggestionLink}>
            {nearestRoute.title || nearestRoute.path}
          </p>
          <p className={styles.similarityScore}>
            {t('similarity')}: {Math.round(nearestRoute.similarity * 100)}%
          </p>
        </div>
          </Link>
      )}
      
      <Link href="/" className={styles.backLink}>
        ← {t('backToLibrary')}
      </Link>
    </div>
  );
}
