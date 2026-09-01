/**
 * @fileoverview Controls Bar — Bottom Bar with Scene Controls
 * @description Renders a floating control bar at the bottom of the scene with
 * toggle buttons for labels, orbit pause, and a reset view button.
 *
 * @module modules/world-sim/presentation/overlay/ControlsBar/ControlsBar
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import {
  useWorldSimDispatch,
  useWorldSimState,
} from '@/modules/world-sim/application/state/WorldSimContext';
import { WorldSimActionType } from '@/modules/world-sim/application/state/worldSimTypes';
import type { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';
import styles from '../overlay.module.scss';

/**
 * Props for the ControlsBar component.
 *
 * @interface ControlsBarProps
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to mediator
 */
interface ControlsBarProps {
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Mediator ref */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
}

/**
 * Floating control bar with scene toggle buttons.
 *
 * @param {ControlsBarProps} props - Component props
 * @param {React.MutableRefObject<WorldSimMediator | null>} props.mediatorRef - Ref to the WorldSim mediator instance
 * @returns {React.ReactElement | null} The controls bar, or null if not initialized
 */
export function ControlsBar({
  mediatorRef,
}: ControlsBarProps): React.ReactElement | null {
  const state = useWorldSimState();
  const dispatch = useWorldSimDispatch();
  const t = useTranslations('worldSim');

  const handleToggleLabels = useCallback(() => {
    dispatch({ type: WorldSimActionType.ToggleLabels });
  }, [dispatch]);

  const handleToggleOrbits = useCallback(() => {
    mediatorRef.current?.toggleOrbitLines();
    dispatch({ type: WorldSimActionType.ToggleOrbits });
  }, [dispatch, mediatorRef]);

  const handleReset = useCallback(() => {
    mediatorRef.current?.resetView();
  }, [mediatorRef]);

  if (!state.isInitialized) return null;

  return (
    <div
      className={styles.controlsBar}
      role='toolbar'
      aria-label={t('controls.title')}>
      <button
        className={`${styles.controlButton} ${state.labelsVisible ? styles.active : ''}`}
        onClick={handleToggleLabels}
        type='button'
        aria-pressed={state.labelsVisible}
        aria-label={t('controls.toggleLabels')}>
        {t('controls.labels')}
      </button>

      <button
        className={`${styles.controlButton} ${state.orbitsPaused ? styles.active : ''}`}
        onClick={handleToggleOrbits}
        type='button'
        aria-pressed={state.orbitsPaused}
        aria-label={t('controls.toggleOrbits')}>
        {t('controls.orbits')}
      </button>

      <button
        className={styles.controlButton}
        onClick={handleReset}
        type='button'
        aria-label={t('controls.reset')}>
        {t('controls.reset')}
      </button>
    </div>
  );
}
