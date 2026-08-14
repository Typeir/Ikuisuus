/**
 * @fileoverview User-facing label for a celestial body.
 * @description Renders a positioned label tracking a body's 2D screen position.
 *
 * @module worldSim/overlay/CelestialLabel
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { forwardRef, memo, useCallback } from 'react';
import { cn } from '@/lib/utils/classNameMerge';
import styles from '../overlay.module.scss';

/**
 * Props for the CelestialLabel component.
 *
 * @interface CelestialLabelProps
 * @property {string} bodyId - Unique identifier of the celestial body
 * @property {string} name - Display name of the body
 * @property {string} subtitle - Short descriptor text
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
  /** @property {boolean} isHovered - Hover state */
  isHovered: boolean;
  /** @property {boolean} isSelected - Selection state */
  isSelected: boolean;
  /** @property {Function} onClick - Click callback */
  onClick: (bodyId: string) => void;
}

/**
 * Positioned label tracking a celestial body's projected screen position.
 *
 * @param {CelestialLabelProps} props - Component props
 * @param {string} props.bodyId - Unique identifier of the celestial body
 * @param {string} props.name - Display name of the body
 * @param {string} props.subtitle - Short descriptor text
 * @param {boolean} props.isHovered - Whether the body is currently hovered
 * @param {boolean} props.isSelected - Whether the body is currently selected
 * @param {(bodyId: string) => void} props.onClick - Callback when the label is clicked
 * @param {React.Ref<HTMLButtonElement>} ref - Forwarded ref to the root DOM element
 * @returns {React.ReactElement} Positioned label element
 */
export const CelestialLabel = memo(
  forwardRef<HTMLButtonElement, CelestialLabelProps>(function CelestialLabel(
    { bodyId, name, subtitle, isHovered, isSelected, onClick },
    ref,
  ): React.ReactElement {
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

    return (
      <button
        ref={ref}
        className={cn(styles.celestialLabel, {
          [styles.hovered]: isHovered,
          [styles.selected]: isSelected,
        })}
        style={{ willChange: 'transform' }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${name} - ${subtitle}`}
        type='button'>
        <span className={styles.labelName}>{name}</span>
        <span className={styles.labelSubtitle}>{subtitle}</span>
      </button>
    );
  }),
);
