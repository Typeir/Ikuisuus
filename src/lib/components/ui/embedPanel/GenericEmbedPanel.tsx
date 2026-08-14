/**
 * @fileoverview Draggable iframe embed panel.
 * @description A context-agnostic Draggable wrapper that embeds iframe content,
 * handling drag, resize, close, and loading state.
 *
 * @module ui/embedPanel/GenericEmbedPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { buildEmbedUrl } from '@/lib/embed';
import type { JSX } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Draggable } from '../draggable/Draggable';

export { buildEmbedUrl };

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
 * @property {string} [draggableClassName] - CSS class for the Draggable wrapper
 * @property {string} [contentClassName] - CSS class for the content wrapper div
 * @property {string} [loadingClassName] - CSS class for the loading container
 * @property {string} [spinnerClassName] - CSS class for the loading spinner
 * @property {string} [iframeClassName] - CSS class for the iframe element
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
  spinnerClassName?: string;
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
  spinnerClassName,
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
      className={draggableClassName}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      testId={testId}
      resizable={resizable}
      onClose={handleClose}>
      <div
        className={contentClassName}
        role={contentRole}
        aria-label={contentAriaLabel}>
        {isLoading && (
          <div className={loadingClassName}>
            <span className={spinnerClassName} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl ?? undefined}
          className={iframeClassName}
          onLoad={handleLoad}
          title={iframeTitle}
          sandbox='allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox'
        />
      </div>
    </Draggable>
  );
}

export default GenericEmbedPanel;
