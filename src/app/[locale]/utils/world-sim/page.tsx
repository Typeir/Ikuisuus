/**
 * @fileoverview World Sim route page at /[locale]/utils/world-sim.
 * @description Renders a Three.js-powered interactive solar system visualization of the Black Cradle.
 *
 * @module worldSimPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/modules/world-sim/application/state/WorldSimContext World sim provider and state hooks
 * @requires @/modules/world-sim/application/state/WorldSimControlsContext World sim controls provider
 * @requires @/modules/world-sim/application/hooks/useWorldSimCanvas World sim canvas integration hook
 * @requires @/modules/world-sim/presentation/overlay/ControlsBar/ControlsBar World sim controls UI
 * @requires @/modules/world-sim/presentation/overlay/InfoPanel/InfoPanel World sim info panel UI
 * @requires @/modules/world-sim/presentation/overlay/OverlayContainer/OverlayContainer World sim overlay labels
 * @requires @/modules/world-sim/presentation/overlay/WorldSimContentPanel/WorldSimContentPanel World sim content panel UI
 *
 * @example
 * ```
 * Route: /en/utils/world-sim
 * Route: /es/utils/world-sim
 * ```
 */

'use client';

import { useWorldSimCanvas } from '@/modules/world-sim/application/hooks/useWorldSimCanvas';
import {
    useWorldSimState,
    WorldSimProvider,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimControlsProvider } from '@/modules/world-sim/application/state/WorldSimControlsContext';
import { ControlsBar } from '@/modules/world-sim/presentation/overlay/ControlsBar/ControlsBar';
import { InfoPanel } from '@/modules/world-sim/presentation/overlay/InfoPanel/InfoPanel';
import { OverlayContainer } from '@/modules/world-sim/presentation/overlay/OverlayContainer/OverlayContainer';
import { WorldSimContentPanel } from '@/modules/world-sim/presentation/overlay/WorldSimContentPanel/WorldSimContentPanel';
import styles from '@/modules/world-sim/presentation/WorldSim/WorldSim.module.scss';
import { useTranslations } from 'next-intl';

/**
 * Inner world sim renderer that consumes world sim context state.
 *
 * @returns {React.ReactElement} World sim visual composition.
 */
function WorldSimPageInner(): React.ReactElement {
  const t = useTranslations('worldSim');
  const state = useWorldSimState();
  const { containerRef, mediatorRef, bindElement, unbindElement } =
    useWorldSimCanvas();

  return (
    <WorldSimControlsProvider mediatorRef={mediatorRef}>
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
          bindElement={bindElement}
          unbindElement={unbindElement}
          mediatorRef={mediatorRef}
        />

        <InfoPanel mediatorRef={mediatorRef} />

        <WorldSimContentPanel />

        <ControlsBar mediatorRef={mediatorRef} />
      </div>
    </WorldSimControlsProvider>
  );
}

/**
 * World Sim page component.
 * Renders the world sim composition.
 *
 * @function WorldSimPage
 * @returns {React.ReactElement} Rendered page with world sim.
 */
export default function WorldSimPage(): React.ReactElement {
  return (
    <WorldSimProvider>
      <WorldSimPageInner />
    </WorldSimProvider>
  );
}
