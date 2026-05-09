/**
 * @fileoverview DEPRECATED: Content Panel — Use WorldSimContentPanel Instead
 * @description This component has been refactored into WorldSimContentPanel (WorldSim-specific)
 * and GenericEmbedPanel (generic reusable wrapper). Use WorldSimContentPanel instead.
 *
 * @module worldSim/overlay/ContentPanel
 * @deprecated Use WorldSimContentPanel from './WorldSimContentPanel' instead
 * @version 1.0.0 (deprecated)
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Draggable } from '../../ui/draggable/Draggable';
import { CelestialRegistry } from '../celestials/CelestialRegistry';
import { useWorldSimState } from '../context/WorldSimContext';
import { ZoomLevel } from '../context/worldSimTypes';
import styles from './overlay.module.scss';

/** @constant {number} CONTENT_PANEL_WIDTH - Default width of the content panel in pixels */
const CONTENT_PANEL_WIDTH = 420;

/** @constant {number} CONTENT_PANEL_LEFT - Left margin from the overlay edge */
const CONTENT_PANEL_LEFT = 32;

/** @constant {number} CONTENT_PANEL_TOP - Top position, accounting for header height (~80px) */
const CONTENT_PANEL_TOP = 100;

/**
 * Compute initial position so the panel sits on the left side under the header.
 *
 * @param {{ width: number; height: number }} parentBounds - Dimensions of the bounding parent
 * @returns {{ x: number; y: number }} Computed initial position
 */
function computeInitialPosition(parentBounds: {
  width: number;
  height: number;
}): { x: number; y: number } {
  return {
    x: CONTENT_PANEL_LEFT,
    y: CONTENT_PANEL_TOP,
  };
}

/**
 * Build the embed URL for a given content path and locale.
 *
 * @param {string} contentPath - Relative library path (e.g. "world/the-lands-of-damocles/ordovica")
 * @param {string} locale - Current locale code (e.g. "en")
 * @returns {string} Full embed URL with query parameter
 */
function buildEmbedUrl(contentPath: string, locale: string): string {
  return `/${locale}/library/${contentPath}?embed=true`;
}

/**
 * Side panel rendering an iframe that loads the content page for the selected
 * celestial body or region. The iframe uses `?embed=true` so the embedded page
 * renders without sidebar/navigation chrome. Supports drag, resize, and close.
 *
 * @returns {React.ReactElement | null} The content panel with iframe, or null when hidden
 */
export function ContentPanel(): React.ReactElement | null {
  const state = useWorldSimState();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const registry = useMemo(() => CelestialRegistry.shared(), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  /** Track the previous body/region to reopen when selection changes */
  const prevSelectionRef = useRef<string | null>(null);

  /**
   * Resolve the content path based on current selection.
   * Region selection takes priority over body selection.
   */
  const contentPath = useMemo(() => {
    if (state.selectedRegionId && state.selectedBodyId) {
      const region = registry.getRegion(
        state.selectedBodyId,
        state.selectedRegionId,
      );
      if (region?.contentPath) return region.contentPath;
    }
    if (state.selectedBodyId) {
      const body = registry.getBodyById(state.selectedBodyId);
      if (body?.contentPath) return body.contentPath;
    }
    return null;
  }, [state.selectedBodyId, state.selectedRegionId, registry]);

  const embedUrl = useMemo(() => {
    if (!contentPath) return null;
    return buildEmbedUrl(contentPath, locale);
  }, [contentPath, locale]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  /** Close the panel without deselecting the body */
  const handleClose = useCallback(() => {
    setIsClosed(true);
  }, []);

  /** Reset loading state when URL changes */
  const previousUrl = useRef<string | null>(null);
  if (embedUrl !== previousUrl.current) {
    previousUrl.current = embedUrl;
    setIsLoading(true);
  }

  /** Reopen panel when selection changes */
  const currentSelection = `${state.selectedBodyId ?? ''}-${state.selectedRegionId ?? ''}`;
  if (currentSelection !== prevSelectionRef.current) {
    prevSelectionRef.current = currentSelection;
    if (isClosed) {
      setIsClosed(false);
    }
  }

  const isVisible =
    state.isInitialized &&
    state.zoomLevel !== ZoomLevel.System &&
    embedUrl !== null &&
    !isClosed;

  if (!isVisible || !embedUrl) return null;

  return (
    <Draggable
      handleLabel='Content'
      initialPosition={computeInitialPosition}
      className={styles.contentPanelDraggable}
      defaultWidth={CONTENT_PANEL_WIDTH}
      defaultHeight={`calc(100% - ${CONTENT_PANEL_TOP + 32}px)`}
      testId='content-panel-draggable'
      resizable
      onClose={handleClose}>
      <div
        className={styles.contentPanel}
        role='complementary'
        aria-label='Content preview'>
        {isLoading && (
          <div className={styles.contentPanelLoading}>
            <span className={styles.contentPanelSpinner} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className={styles.contentPanelIframe}
          onLoad={handleLoad}
          title='Content preview'
          sandbox='allow-same-origin allow-scripts allow-popups'
        />
      </div>
    </Draggable>
  );
}
