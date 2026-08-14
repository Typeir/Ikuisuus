/**
 * @fileoverview CounterChip atom
 * @description Floating count pill rendered `position: absolute`; returns null
 * when `count <= 0`. Memoised, re-renders only when its props change.
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
 * Floating count pill; returns null when `count <= 0`.
 *
 * @component
 * @param {CounterChipProps} props - Component props
 * @param {number} props.count - Drives visibility; hides chip when <= 0
 * @param {string} props.text - Visible pill text, already formatted/pluralised by the caller
 * @param {string} props.ariaLabel - Accessible label for the status region
 * @param {CounterChipTone} [props.tone=warning] - Tint
 * @param {CounterChipCorner} [props.corner=top-right] - Anchor corner
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
 * Memoised `CounterChip`. Re-renders only when its props change by value.
 */
export const CounterChip = memo(CounterChipImpl);
