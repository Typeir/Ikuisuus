/**
 * @fileoverview Async Tooltip Component
 * @description Generic tooltip that lazily fetches its content on first hover.
 * Content is fetched exactly once; subsequent hovers use the cached result.
 * The `fetchContent` callback is caller-owned, keeping this component agnostic
 * of MDX, REST, or any other content source.
 *
 * @module lib/components/ui/asyncTooltip/asyncTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import type { TooltipPlacement } from '@/lib/components/ui/tooltip';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

/**
 * Fetch lifecycle states for async content loading.
 *
 * @typedef {'idle' | 'loading' | 'loaded' | 'error'} FetchStatus
 */
type FetchStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Props for `<AsyncTooltip>`.
 *
 * @interface AsyncTooltipProps
 * @property {() => Promise<ReactNode>} fetchContent - Called on first hover to load tooltip content
 * @property {ReactNode} [fallback] - Shown while idle, loading, or on error
 * @property {ReactElement} children - Trigger element passed through to Tooltip
 * @property {TooltipPlacement} [placement] - Tooltip placement (default `top`)
 * @property {number} [showDelay] - Delay before showing tooltip in ms
 * @property {number} [hideDelay] - Delay before hiding tooltip in ms
 * @property {boolean} [clickable] - Whether tooltip has a clickable action
 * @property {() => void} [onItemClick] - Callback when clickable tooltip is clicked
 * @property {boolean} [showClickIcon] - Whether to show the click icon
 * @property {boolean} [disabled] - Whether tooltip is disabled
 * @property {number} [maxWidth] - Maximum width of tooltip in px
 */
export interface AsyncTooltipProps {
  fetchContent: () => Promise<ReactNode>;
  fallback?: ReactNode;
  children: ReactElement;
  placement?: TooltipPlacement;
  showDelay?: number;
  hideDelay?: number;
  clickable?: boolean;
  onItemClick?: () => void;
  showClickIcon?: boolean;
  disabled?: boolean;
  maxWidth?: number;
}

/**
 * Tooltip that defers content loading until first hover. Subsequent hovers
 * use the already-loaded content without re-fetching.
 *
 * @component
 * @param {AsyncTooltipProps} props - Component props
 * @returns {JSX.Element} Rendered async tooltip
 */
export const AsyncTooltip: React.FC<AsyncTooltipProps> = ({
  fetchContent,
  fallback,
  children,
  placement = 'top',
  showDelay = 250,
  hideDelay,
  clickable,
  onItemClick,
  showClickIcon,
  disabled,
  maxWidth,
}) => {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [loadedContent, setLoadedContent] = useState<ReactNode>(null);
  const fetchedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setStatus('loading');

    fetchContent()
      .then((content) => {
        setLoadedContent(content);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [fetchContent]);

  const content = status === 'loaded' ? loadedContent : (fallback ?? '');

  return (
    <span onMouseEnter={handleMouseEnter} style={{ display: 'contents' }}>
      <Tooltip
        content={content}
        placement={placement}
        showDelay={showDelay}
        hideDelay={hideDelay}
        clickable={clickable}
        onItemClick={onItemClick}
        showClickIcon={showClickIcon}
        disabled={disabled}
        maxWidth={maxWidth}>
        {children}
      </Tooltip>
    </span>
  );
};
