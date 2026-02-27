/**
 * @fileoverview Celestial Label — Floating Name Tag for Bodies
 * @description Renders a positioned label that tracks a celestial body's 2D
 * screen position. Includes the body name, subtitle, and hover/selection states.
 * Uses CSS transforms for GPU-accelerated positioning.
 *
 * @module worldSim/overlay/CelestialLabel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { memo, useCallback } from 'react';
import type { ProjectedPosition } from '../celestials/interfaces';
import styles from './overlay.module.scss';

/**
 * Props for the CelestialLabel component.
 *
 * @interface CelestialLabelProps
 * @property {string} bodyId - Unique identifier of the celestial body
 * @property {string} name - Display name of the body
 * @property {string} subtitle - Short descriptor text
 * @property {ProjectedPosition} position - Projected 2D screen position
 * @property {boolean} isHovered - Whether the body is currently hovered
 * @property {boolean} isSelected - Whether the body is currently selected
 * @property {Function} onClick - Callback when the label is clicked
 */
interface CelestialLabelProps {
  /** @property {string} bodyId - Body identifier */
  bodyId: string;
  /** @property {string} name - Display name */
  name: string;
  /** @property {string} subtitle - Short descriptor */
  subtitle: string;
  /** @property {ProjectedPosition} position - Screen position with scale */
  position: ProjectedPosition;
  /** @property {boolean} isHovered - Hover state */
  isHovered: boolean;
  /** @property {boolean} isSelected - Selection state */
  isSelected: boolean;
  /** @property {Function} onClick - Click callback */
  onClick: (bodyId: string) => void;
}

/**
 * A floating label that tracks a celestial body's projected screen position.
 * Uses CSS transform + translate for GPU-accelerated repositioning each frame.
 *
 * @param {CelestialLabelProps} props - Component props
 * @returns {React.ReactElement} Positioned label element
 */
export const CelestialLabel = memo(function CelestialLabel({
  bodyId,
  name,
  subtitle,
  position,
  isHovered,
  isSelected,
  onClick,
}: CelestialLabelProps): React.ReactElement {
  const handleClick = useCallback(() => {
    onClick(bodyId);
  }, [bodyId, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(bodyId);
      }
    },
    [bodyId, onClick],
  );

  const classNames = [
    styles.celestialLabel,
    isHovered ? styles.hovered : '',
    isSelected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -100%) scale(${position.scale})`,
        willChange: 'transform',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${name} - ${subtitle}`}
      type='button'>
      <span className={styles.labelName}>{name}</span>
      <span className={styles.labelSubtitle}>{subtitle}</span>
    </button>
  );
});
