/**
 * @fileoverview Archivist Panel — "The Archivist is reading…"
 * @description Renders a library page embed on the home page. Positions
 * to the right of main content when space allows, below otherwise.
 * Not draggable — fixed position.
 *
 * @module modules/search/presentation/ArchivistPanel/ArchivistPanel
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { buildEmbedUrl } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { type FeaturedPage } from '../../domain/featuredPages';
import styles from './ArchivistPanel.module.scss';

/** Minimum viewport width remaining for side-panel layout. */
const MIN_SIDE_PANEL_WIDTH = 360;

/** Minimum percentage of viewport remaining for side layout. */
const MIN_SIDE_PANEL_PCT = 0.25;

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
 * Renders a library page embed with responsive positioning.
 *
 * @param {ArchivistPanelProps} props - Component props
 * @returns {JSX.Element} The archivist panel
 */
export function ArchivistPanel({
  page,
  locale,
  onClose,
}: ArchivistPanelProps): JSX.Element {
  const [sideLayout, setSideLayout] = useState(true);
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('search');

  useEffect(() => {
    function measure(): void {
      if (!containerRef.current) return;
      const vw = window.innerWidth;
      const rect = containerRef.current.getBoundingClientRect();
      const remaining = vw - rect.right;
      const threshold = Math.max(
        vw * MIN_SIDE_PANEL_PCT - 40,
        MIN_SIDE_PANEL_WIDTH,
      );
      setSideLayout(remaining > threshold);
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!open) return <></>;

  const url = buildEmbedUrl(page.path, locale);

  return (
    <div
      ref={containerRef}
      className={cn(styles.panel, sideLayout ? styles.side : styles.below)}>
      <iframe
        src={url}
        className={styles.iframe}
        title={`Preview: ${page.title}`}
        sandbox='allow-scripts allow-same-origin'
      />
    </div>
  );
}
