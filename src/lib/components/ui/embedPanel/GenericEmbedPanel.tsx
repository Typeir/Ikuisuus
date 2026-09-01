/**
 * @fileoverview Draggable iframe embed panel.
 * @description A context-agnostic Draggable wrapper that embeds iframe content,
 * handling drag, resize, close, and loading state.
 *
 * @module lib/components/ui/embedPanel/GenericEmbedPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton } from '@/lib/components/skeleton';
import { buildEmbedUrl } from '@/lib/embed';
import { cn } from '@/lib/utils/classNameMerge';
import type { JSX } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Draggable } from '../draggable/Draggable';
import styles from './embedPanel.module.scss';

export { buildEmbedUrl };

/** Prose line widths for the loading skeleton. */
const SKELETON_PROSE = ['92%', '85%', '95%', '72%'];

/**
 * Page-shaped placeholder shown while an embed loads: a title line, prose
 * lines, and one rectangle. The default loading content for
 * {@link GenericEmbedPanel}; exported for hosts that render a loading state
 * outside the panel.
 *
 * @returns {JSX.Element} The skeleton block
 */
export function EmbedSkeleton(): JSX.Element {
  return (
    <div className={styles.loadingSkeleton} aria-hidden='true'>
      <Skeleton variant='text' width='58%' height='1.5rem' />
      {SKELETON_PROSE.map((width) => (
        <Skeleton key={width} variant='text' width={width} height='0.875rem' />
      ))}
      <Skeleton variant='rectangle' height='7rem' />
    </div>
  );
}

/**
 * @interface GenericEmbedPanelProps
 * Configuration for GenericEmbedPanel component.
 * @property {string | null} url - Content URL path to embed (e.g. "world/the-lands-of-damocles/ordovica")
 * @property {string} locale - Locale code for the embed URL (e.g. "en")
 * @property {(bounds: {width: number; height: number}) => {x: number; y: number}} initialPosition - Function to compute initial position
 * @property {string | number} [defaultWidth='100%'] - Default width (CSS value or number in px)
 * @property {string | number} [defaultHeight='100%'] - Default height (CSS value or number in px)
 * @property {string} handleLabel - Label displayed on the drag handle
 * @property {boolean} [resizable=true] - Whether the panel is resizable
 * @property {string} [testId] - Test identifier for the draggable element
 * @property {string} [draggableClassName] - Replaces the default Draggable chrome
 * @property {string} [contentClassName] - Replaces the default content wrapper style
 * @property {string} [loadingClassName] - Replaces the default loading overlay style
 * @property {React.ReactNode} [loadingContent] - Replaces the default {@link EmbedSkeleton} loading content
 * @property {string} [iframeClassName] - Replaces the default iframe style
 * @property {string} [contentRole='complementary'] - ARIA role for the content wrapper
 * @property {string} [contentAriaLabel] - ARIA label for the content wrapper
 * @property {string} [iframeTitle='Embed'] - Title attribute for the iframe
 * @property {() => void} [onLoadingStart] - Callback when loading starts
 * @property {() => void} [onLoadingEnd] - Callback when loading ends
 * @property {(url: string | null) => void} [onUrlChange] - Callback when content URL changes
 * @property {() => void} [onClosed] - Callback when panel is closed
 */
export interface GenericEmbedPanelProps {
  url: string | null;
  locale: string;
  initialPosition: (bounds: { width: number; height: number }) => {
    x: number;
    y: number;
  };
  defaultWidth?: string | number;
  defaultHeight?: string | number;
  handleLabel: string;
  resizable?: boolean;
  testId?: string;
  draggableClassName?: string;
  contentClassName?: string;
  loadingClassName?: string;
  loadingContent?: React.ReactNode;
  iframeClassName?: string;
  contentRole?: string;
  contentAriaLabel?: string;
  iframeTitle?: string;
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
  onUrlChange?: (url: string | null) => void;
  onClosed?: () => void;
}

/**
 * Draggable iframe container. Builds the embed URL via buildEmbedUrl, tracks
 * loading and close state, and fires lifecycle callbacks.
 *
 * @component
 * @param {GenericEmbedPanelProps} props - Configuration
 * @returns {JSX.Element | null} Rendered draggable embed panel, or null when closed
 */
export function GenericEmbedPanel({
  url,
  locale,
  initialPosition,
  defaultWidth = '100%',
  defaultHeight = '100%',
  handleLabel,
  resizable = true,
  testId,
  draggableClassName,
  contentClassName,
  loadingClassName,
  loadingContent,
  iframeClassName,
  contentRole = 'complementary',
  contentAriaLabel,
  iframeTitle = 'Embed',
  onLoadingStart,
  onLoadingEnd,
  onUrlChange,
  onClosed,
}: GenericEmbedPanelProps): JSX.Element | null {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  const embedUrl = useMemo(() => {
    if (!url) return null;
    return buildEmbedUrl(url, locale);
  }, [url, locale]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoadingEnd?.();
  }, [onLoadingEnd]);

  const handleClose = useCallback(() => {
    setIsClosed(true);
    onClosed?.();
  }, [onClosed]);

  const previousUrl = useRef<string | null>(null);
  if (url !== previousUrl.current) {
    previousUrl.current = url;
    setIsLoading(true);
    setIsClosed(false);
    onUrlChange?.(url);
    onLoadingStart?.();
  }

  if (isClosed) return null;

  return (
    <Draggable
      handleLabel={handleLabel}
      initialPosition={initialPosition}
      className={draggableClassName ?? styles.draggable}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      testId={testId}
      resizable={resizable}
      onClose={handleClose}>
      <div
        className={contentClassName ?? styles.content}
        role={contentRole}
        aria-label={contentAriaLabel}>
        <div
          className={cn(
            loadingClassName ?? styles.loading,
            !isLoading && styles.loadingDone,
          )}
          aria-hidden={!isLoading}>
          {loadingContent ?? <EmbedSkeleton />}
        </div>
        <iframe
          ref={iframeRef}
          src={embedUrl ?? undefined}
          className={iframeClassName ?? styles.iframe}
          onLoad={handleLoad}
          title={iframeTitle}
          sandbox='allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox'
        />
      </div>
    </Draggable>
  );
}

export default GenericEmbedPanel;
