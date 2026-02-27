/**
 * @fileoverview WorldSim Root Component — Main Entry Point
 * @description Composes the Three.js canvas, overlay container, info panel, and
 * controls bar into the complete World Sim experience. Wraps everything in the
 * WorldSimProvider for state management.
 *
 * @module worldSim/WorldSim
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { useWorldSimState, WorldSimProvider } from './context/WorldSimContext';
import { useWorldSimCanvas } from './hooks/useWorldSimCanvas';
import { ControlsBar } from './overlay/ControlsBar';
import { InfoPanel } from './overlay/InfoPanel';
import { OverlayContainer } from './overlay/OverlayContainer';
import styles from './WorldSim.module.scss';

/**
 * Inner component that uses the WorldSim context (must be inside provider).
 * Handles canvas mounting, overlay rendering, and loading state.
 *
 * @returns {React.ReactElement} The World Sim canvas and overlays
 */
function WorldSimInner(): React.ReactElement {
  const t = useTranslations('worldSim');
  const state = useWorldSimState();
  const { containerRef, mediatorRef, subscribeToProjections } =
    useWorldSimCanvas();

  return (
    <div className={styles.worldSimWrapper}>
      <div ref={containerRef} className={styles.canvasContainer} />

      {!state.isInitialized && (
        <div className={styles.loadingOverlay}>
          <span className={styles.loadingText}>{t('loading')}</span>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{t('title')}</h1>
        <p className={styles.headerSubtitle}>{t('subtitle')}</p>
      </div>

      <OverlayContainer
        subscribeToProjections={subscribeToProjections}
        mediatorRef={mediatorRef}
      />

      <InfoPanel mediatorRef={mediatorRef} />

      <ControlsBar mediatorRef={mediatorRef} />
    </div>
  );
}

/**
 * World Sim root component. Provides the WorldSimProvider context and renders
 * the WorldSimInner component.
 *
 * @returns {React.ReactElement} The complete World Sim module
 *
 * @example
 * ```tsx
 * // In a Next.js page:
 * import { WorldSim } from '@/lib/components/worldSim';
 * export default function WorldSimPage() {
 *   return <WorldSim />;
 * }
 * ```
 */
export function WorldSim(): React.ReactElement {
  return (
    <WorldSimProvider>
      <WorldSimInner />
    </WorldSimProvider>
  );
}
