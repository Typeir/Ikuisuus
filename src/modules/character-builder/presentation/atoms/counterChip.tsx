/**
 * @fileoverview CounterChip atom
 * @description A small floating count pill (e.g. "3 unspent proficiencies").
 * Rendered `position: absolute` inside a `position: relative` ancestor so it
 * overlays a corner without displacing siblings or reflowing the container, and
 * renders nothing when `count <= 0` (so appearing/disappearing never shifts
 * layout). Memoised so it re-renders only when its own props change, decoupled
 * from host-container re-renders.
 *
 * @module modules/character-builder/presentation/atoms/counterChip
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { memo } from 'react';
import styles from './counterChip.module.scss';

/**
 * Visual tone, mapped to a themed tint.
 *
 * @typedef {'warning' | 'neutral' | 'success'} CounterChipTone
 */
export type CounterChipTone = 'warning' | 'neutral' | 'success';

/**
 * Corner the chip anchors to within its positioned ancestor.
 *
 * @typedef {'top-right' | 'top-left'} CounterChipCorner
 */
export type CounterChipCorner = 'top-right' | 'top-left';

/**
 * Props for `<CounterChip>`.
 *
 * @interface CounterChipProps
 * @property {number} count - Drives visibility; the chip hides itself when <= 0
 * @property {string} text - Visible pill text, already formatted/pluralised by the caller
 * @property {string} ariaLabel - Accessible label for the status region
 * @property {CounterChipTone} [tone] - Tint (default `warning`)
 * @property {CounterChipCorner} [corner] - Anchor corner (default `top-right`)
 */
export interface CounterChipProps {
  count: number;
  text: string;
  ariaLabel: string;
  tone?: CounterChipTone;
  corner?: CounterChipCorner;
}

/**
 * Floating count pill. Returns null when there is nothing to show.
 *
 * @component
 * @param {CounterChipProps} props - Component props
 * @param {number} props.count - Drives visibility; the chip hides itself when <= 0
 * @param {string} props.text - Visible pill text, already formatted/pluralised by the caller
 * @param {string} props.ariaLabel - Accessible label for the status region
 * @param {CounterChipTone} [props.tone=warning] - Tint (default `warning`)
 * @param {CounterChipCorner} [props.corner=top-right] - Anchor corner (default `top-right`)
 * @returns {JSX.Element | null} Rendered chip, or null when `count <= 0`
 */
const CounterChipImpl: React.FC<CounterChipProps> = ({
  count,
  text,
  ariaLabel,
  tone = 'warning',
  corner = 'top-right',
}) => {
  if (count <= 0) return null;
  return (
    <span
      className={`${styles.chip} ${styles[tone]} ${styles[corner]}`}
      role='status'
      aria-label={ariaLabel}>
      {text}
    </span>
  );
};

/**
 * Memoised `CounterChip`. Re-renders only when its own props change by value,
 * so it is decoupled from host-container re-renders.
 */
export const CounterChip = memo(CounterChipImpl);
