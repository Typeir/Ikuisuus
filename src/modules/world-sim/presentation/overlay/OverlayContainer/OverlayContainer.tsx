/**
 * @fileoverview Overlay Container — Positions DOM Elements Over 3D Scene
 * @description Binds CelestialLabel DOM elements to the ProjectionBridge, applying
 * position, visibility, and scale transforms each frame without React re-renders.
 *
 * @module worldSim/overlay/OverlayContainer
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import { useWorldSimState } from '@/modules/world-sim/application/state/WorldSimContext';
import type { WorldSimMediator } from '@/modules/world-sim/application/mediator/WorldSimMediator';
import { CelestialLabel } from '@/modules/world-sim/presentation/overlay/CelestialLabel/CelestialLabel';
import styles from '../overlay.module.scss';

/**
 * Props for the OverlayContainer component.
 *
 * @interface OverlayContainerProps
 * @property {Function} bindElement - Bind a DOM element for direct transform updates
 * @property {Function} unbindElement - Unbind a DOM element from projection updates
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to the mediator
 */
interface OverlayContainerProps {
  /** @property {Function} bindElement - Bind a DOM element for direct CSS transform updates */
  bindElement: (id: string, element: HTMLElement) => void;
  /** @property {Function} unbindElement - Unbind a DOM element from projection updates */
  unbindElement: (id: string) => void;
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to mediator */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
}

/**
 * Renders DOM labels over celestial bodies, bound to the ProjectionBridge
 * which applies CSS transforms (position, visibility, scale) each frame
 * without React re-renders.
 *
 * @param {OverlayContainerProps} props - Component props
 * @param {(id: string, element: HTMLElement) => void} props.bindElement - Bind a DOM element for direct CSS transform updates
 * @param {(id: string) => void} props.unbindElement - Unbind a DOM element from projection updates
 * @param {React.MutableRefObject<WorldSimMediator | null>} props.mediatorRef - Ref to the WorldSim mediator instance
 * @returns {React.ReactElement} The overlay container with positioned labels
 */
export function OverlayContainer({
  bindElement,
  unbindElement,
  mediatorRef,
}: OverlayContainerProps): React.ReactElement {
  const state = useWorldSimState();
  const t = useTranslations('worldSim');
  const [registry] = useState(() => CelestialRegistry.shared());

  const handleBodyClick = useCallback(
    (bodyId: string) => {
      mediatorRef.current?.zoomToBody(bodyId);
    },
    [mediatorRef],
  );

  /**
   * Bind or unbind a label element to the projection bridge.
   *
   * @param {string} bodyId - Body identifier
   * @param {HTMLButtonElement | null} el - DOM element or null on unmount
   */
  const setLabelRef = useCallback(
    (bodyId: string, el: HTMLButtonElement | null) => {
      if (el) {
        bindElement(bodyId, el);
      } else {
        unbindElement(bodyId);
      }
    },
    [bindElement, unbindElement],
  );

  if (!state.labelsVisible || !state.isInitialized) {
    return <div className={styles.overlayContainer} />;
  }

  const bodies = registry.getAllBodies();

  return (
    <div className={styles.overlayContainer}>
      {bodies.map((body) => (
        <CelestialLabel
          key={body.id}
          ref={(el: HTMLButtonElement | null) => setLabelRef(body.id, el)}
          bodyId={body.id}
          name={t(`bodies.${body.id}.name`)}
          subtitle={t(`bodies.${body.id}.subtitle`)}
          isHovered={state.hoveredBodyId === body.id}
          isSelected={state.selectedBodyId === body.id}
          onClick={handleBodyClick}
        />
      ))}
    </div>
  );
}
