/**
 * @fileoverview WorldSim Content Panel — WorldSim-Specific Embed Panel Wrapper
 * @description Wraps GenericEmbedPanel with WorldSim-specific state management,
 * positioning logic, and selection tracking. Determines which celestial body or region
 * to render and passes the embed URL to GenericEmbedPanel.
 *
 * @module worldSim/overlay/WorldSimContentPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { GenericEmbedPanel } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import { useWorldSimState } from '@/modules/world-sim/application/state/WorldSimContext';
import { useWorldSimControls } from '@/modules/world-sim/application/state/WorldSimControlsContext';
import { ZoomLevel } from '@/modules/world-sim/application/state/worldSimTypes';
import styles from '../overlay.module.scss';

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
 * WorldSim-specific wrapper around GenericEmbedPanel.
 * Manages selection tracking, visibility logic, and embed URL determination.
 * Renders a draggable iframe for the selected celestial body or region.
 *
 * @returns {React.ReactElement | null} The content panel with iframe, or null when hidden
 */
export function WorldSimContentPanel(): React.ReactElement | null {
  const state = useWorldSimState();
  const controls = useWorldSimControls();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const registry = useMemo(() => CelestialRegistry.shared(), []);

  /**
   * Reset the camera and clear selection when the panel is closed so the
   * scene returns to system overview and re-clicking the same body produces
   * a fresh selection transition (which re-opens the panel).
   */
  const handleClosed = useCallback(() => {
    controls.resetView();
  }, [controls]);

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

  const isVisible =
    state.isInitialized &&
    state.zoomLevel !== ZoomLevel.System &&
    contentPath !== null;

  if (!isVisible || !contentPath) return null;

  return (
    <GenericEmbedPanel
      handleLabel='Content'
      initialPosition={computeInitialPosition}
      url={contentPath}
      locale={locale}
      draggableClassName={styles.contentPanelDraggable}
      contentClassName={styles.contentPanel}
      loadingClassName={styles.contentPanelLoading}
      spinnerClassName={styles.contentPanelSpinner}
      iframeClassName={styles.contentPanelIframe}
      defaultWidth={CONTENT_PANEL_WIDTH}
      defaultHeight={`calc(100% - ${CONTENT_PANEL_TOP + 32}px)`}
      testId='content-panel-draggable'
      resizable
      contentRole='complementary'
      contentAriaLabel='Content preview'
      iframeTitle='Content preview'
      onClosed={handleClosed}
    />
  );
}
