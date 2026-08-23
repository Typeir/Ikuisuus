/**
 * @fileoverview Renders a library page embed on the home page.
 * @description Embeds a FeaturedPage in an iframe. Fills the layout cell it
 * is given; the home-page bento decides side-by-side versus stacked. Holds a
 * skeleton in the same box until the pick resolves and the embed reports load.
 *
 * @module modules/search/presentation/ArchivistPanel/ArchivistPanel
 * @version 1.1.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton';
import { buildEmbedUrl } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { useState } from 'react';
import { type FeaturedPage } from '../../domain/featuredPages';
import styles from './ArchivistPanel.module.scss';

/**
 * Props for the ArchivistPanel component.
 *
 * @interface ArchivistPanelProps
 * @property {FeaturedPage | null} page - The page to embed, or null while the pick is pending
 * @property {string} locale - Current locale
 * @property {() => void} [onClose] - Callback when the panel is dismissed
 */
interface ArchivistPanelProps {
  page: FeaturedPage | null;
  locale: string;
  onClose?: () => void;
}

/** Line widths of the body placeholder, mirroring a prose page. */
const SKELETON_PROSE = ['96%', '88%', '93%', '71%'];

/**
 * Renders a library page embed that fills its layout cell. Renders a
 * same-sized skeleton until `page` resolves and the iframe fires `load`, so
 * the cell never changes size between the two states.
 *
 * @param {ArchivistPanelProps} props - Component props
 * @param {FeaturedPage | null} props.page - The page to embed, or null while the pick is pending
 * @param {string} props.locale - Current locale
 * @returns {JSX.Element} The archivist panel
 */
export function ArchivistPanel({
  page,
  locale,
}: ArchivistPanelProps): JSX.Element {
  const t = useTranslations('search');
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const ready = page !== null && loadedPath === page.path;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>{t('archivistReading')}</span>
        {page ? (
          <span className={styles.pageTitle}>{page.title}</span>
        ) : (
          <Skeleton
            variant='text'
            width='40%'
            height='0.6875rem'
            className={styles.titleSkeleton}
          />
        )}
      </div>

      <div className={styles.body}>
        {page && (
          <iframe
            key={page.path}
            src={buildEmbedUrl(page.path, locale)}
            className={styles.iframe}
            title={`Preview: ${page.title}`}
            sandbox='allow-scripts allow-same-origin'
            onLoad={() => setLoadedPath(page.path)}
          />
        )}

        <div
          className={cn(styles.bodySkeleton, ready && styles.bodySkeletonDone)}
          aria-hidden='true'>
          <Skeleton variant='text' width='58%' height='1.5rem' />
          {SKELETON_PROSE.map((width) => (
            <Skeleton
              key={`lead-${width}`}
              variant='text'
              width={width}
              height='0.875rem'
            />
          ))}
          <Skeleton variant='rectangle' height='7rem' />
          {SKELETON_PROSE.map((width) => (
            <Skeleton
              key={`tail-${width}`}
              variant='text'
              width={width}
              height='0.875rem'
            />
          ))}
        </div>
      </div>

      {!ready && (
        <p className='sr-only' role='status'>
          {t('archivistLoading')}
        </p>
      )}
    </div>
  );
}
