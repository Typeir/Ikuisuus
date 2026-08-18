/**
 * @fileoverview Renders a library page embed on the home page.
 * @description Embeds a FeaturedPage in an iframe. Fills the layout cell it
 * is given; the home-page bento decides side-by-side versus stacked.
 *
 * @module modules/search/presentation/ArchivistPanel/ArchivistPanel
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { buildEmbedUrl } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { useState } from 'react';
import { type FeaturedPage } from '../../domain/featuredPages';
import styles from './ArchivistPanel.module.scss';

/**
 * Props for the ArchivistPanel component.
 *
 * @interface ArchivistPanelProps
 * @property {FeaturedPage} page - The page to embed
 * @property {string} locale - Current locale
 * @property {() => void} [onClose] - Callback when the panel is dismissed
 */
interface ArchivistPanelProps {
  page: FeaturedPage;
  locale: string;
  onClose?: () => void;
}

/**
 * Renders a library page embed that fills its layout cell.
 *
 * @param {ArchivistPanelProps} props - Component props
 * @param {FeaturedPage} props.page - The page to embed
 * @param {string} props.locale - Current locale
 * @param {() => void} [props.onClose] - Callback when the panel is dismissed
 * @returns {JSX.Element} The archivist panel
 */
export function ArchivistPanel({
  page,
  locale,
  onClose,
}: ArchivistPanelProps): JSX.Element {
  const [open] = useState(true);
  const t = useTranslations('search');

  if (!open) return <></>;

  const url = buildEmbedUrl(page.path, locale);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>{t('archivistReading')}</span>
        <span className={styles.pageTitle}>{page.title}</span>
      </div>
      <iframe
        src={url}
        className={styles.iframe}
        title={`Preview: ${page.title}`}
        sandbox='allow-scripts allow-same-origin'
      />
    </div>
  );
}
