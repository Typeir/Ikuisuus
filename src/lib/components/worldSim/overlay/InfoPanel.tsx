/**
 * @fileoverview Info Panel — Detailed Body Information Overlay
 * @description Displays a side panel with detailed information about the selected
 * celestial body, including its name, subtitle, lore origin, and region links.
 * Appears when a body is selected (zoom level = Body).
 *
 * @module worldSim/overlay/InfoPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { CelestialRegistry } from '../celestials/CelestialRegistry';
import { useWorldSimState } from '../context/WorldSimContext';
import { ZoomLevel } from '../context/worldSimTypes';
import type { WorldSimMediator } from '../WorldSimMediator';
import styles from './overlay.module.scss';

/**
 * Props for the InfoPanel component.
 *
 * @interface InfoPanelProps
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to mediator
 */
interface InfoPanelProps {
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
}

/**
 * Side panel showing details of the currently selected celestial body.
 * Renders body name, subtitle, lore origin description, and clickable region list.
 *
 * @param {InfoPanelProps} props - Component props
 * @param {React.MutableRefObject<WorldSimMediator | null>} props.mediatorRef - Ref to the WorldSim mediator instance
 * @returns {React.ReactElement | null} The info panel, or null if no body selected
 */
export function InfoPanel({
  mediatorRef,
}: InfoPanelProps): React.ReactElement | null {
  const state = useWorldSimState();
  const t = useTranslations('worldSim');
  const registry = useMemo(() => CelestialRegistry.shared(), []);

  const selectedBody = useMemo(() => {
    if (!state.selectedBodyId) return null;
    return registry.getBodyById(state.selectedBodyId) ?? null;
  }, [state.selectedBodyId, registry]);

  const handleRegionClick = useCallback(
    (regionId: string) => {
      if (state.selectedBodyId) {
        mediatorRef.current?.zoomToRegion(state.selectedBodyId, regionId);
      }
    },
    [state.selectedBodyId, mediatorRef],
  );

  const handleBack = useCallback(() => {
    mediatorRef.current?.resetView();
  }, [mediatorRef]);

  if (
    !selectedBody ||
    state.zoomLevel === ZoomLevel.System ||
    !state.isInitialized
  ) {
    return null;
  }

  return (
    <div
      className={styles.infoPanel}
      role='complementary'
      aria-label={t('bodyInfo')}>
      <button
        className={styles.backButton}
        onClick={handleBack}
        type='button'
        aria-label={t('controls.back')}>
        ← {t('controls.back')}
      </button>

      <h2 className={styles.infoPanelTitle}>
        {t(`bodies.${selectedBody.id}.name`)}
      </h2>
      <p className={styles.infoPanelSubtitle}>
        {t(`bodies.${selectedBody.id}.subtitle`)}
      </p>
      <p className={styles.infoPanelLore}>
        {t(`bodies.${selectedBody.id}.loreOrigin`)}
      </p>

      {selectedBody.regions.length > 0 && (
        <div className={styles.regionList}>
          <h3 className={styles.regionListTitle}>{t('regions')}</h3>
          <ul>
            {selectedBody.regions.map((region) => (
              <li key={region.id}>
                <button
                  className={`${styles.regionButton} ${
                    state.selectedRegionId === region.id
                      ? styles.regionSelected
                      : ''
                  }`}
                  onClick={() => handleRegionClick(region.id)}
                  type='button'
                  aria-label={t(
                    `bodies.${selectedBody.id}.regions.${region.id}`,
                  )}>
                  {t(`bodies.${selectedBody.id}.regions.${region.id}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
