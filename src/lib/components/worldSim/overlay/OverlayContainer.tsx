/**
 * @fileoverview Overlay Container — Positions DOM Elements Over 3D Scene
 * @description Subscribes to ProjectionBridge updates and renders CelestialLabel
 * components at the correct 2D screen positions. Acts as the bridge between
 * the Three.js coordinate system and React DOM overlay elements.
 *
 * @module worldSim/overlay/OverlayContainer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { CelestialRegistry } from '../celestials/CelestialRegistry';
import type { ProjectedPosition } from '../celestials/interfaces';
import { useWorldSimState } from '../context/WorldSimContext';
import type { WorldSimMediator } from '../WorldSimMediator';
import { CelestialLabel } from './CelestialLabel';
import styles from './overlay.module.scss';

/**
 * Props for the OverlayContainer component.
 *
 * @interface OverlayContainerProps
 * @property {Function} subscribeToProjections - Subscription function from useWorldSimCanvas
 * @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to the mediator
 */
interface OverlayContainerProps {
  /** @property {Function} subscribeToProjections - Projection subscription callback */
  subscribeToProjections: (
    callback: (positions: Map<string, ProjectedPosition>) => void,
  ) => (() => void) | undefined;
  /** @property {React.MutableRefObject<WorldSimMediator | null>} mediatorRef - Ref to mediator */
  mediatorRef: React.MutableRefObject<WorldSimMediator | null>;
}

/**
 * Renders floating DOM labels positioned over celestial bodies in the 3D scene.
 * Subscribes to the ProjectionBridge for per-frame position updates.
 *
 * @param {OverlayContainerProps} props - Component props
 * @returns {React.ReactElement} The overlay container with positioned labels
 */
export function OverlayContainer({
  subscribeToProjections,
  mediatorRef,
}: OverlayContainerProps): React.ReactElement {
  const [positions, setPositions] = useState<Map<string, ProjectedPosition>>(
    new Map(),
  );
  const state = useWorldSimState();
  const [registry] = useState(() => new CelestialRegistry());

  useEffect(() => {
    const unsubscribe = subscribeToProjections((newPositions) => {
      setPositions(new Map(newPositions));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToProjections]);

  const handleBodyClick = useCallback(
    (bodyId: string) => {
      mediatorRef.current?.zoomToBody(bodyId);
    },
    [mediatorRef],
  );

  if (!state.labelsVisible || !state.isInitialized) {
    return <div className={styles.overlayContainer} />;
  }

  const bodies = registry.getAllBodies();

  return (
    <div className={styles.overlayContainer}>
      {bodies.map((body) => {
        const position = positions.get(body.id);
        if (!position || !position.visible) return null;

        return (
          <CelestialLabel
            key={body.id}
            bodyId={body.id}
            name={body.name}
            subtitle={body.subtitle}
            position={position}
            isHovered={state.hoveredBodyId === body.id}
            isSelected={state.selectedBodyId === body.id}
            onClick={handleBodyClick}
          />
        );
      })}
    </div>
  );
}
