/**
 * @fileoverview Chip Primitive
 * @description Compact pill-style label used for tag-like UIs (selected boons,
 * vocation features, specialization features, feats). Optional leading icon,
 * trailing remove button, and a variant prop that maps to a CSS hue token.
 *
 * @module lib/components/ui/chip/chip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { X } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import styles from './chip.module.scss';

/**
 * Visual variant. Each variant maps to a CSS class that picks a tinted
 * background + accent border via existing CSS variables.
 *
 * @typedef {'boon'|'vocation-feature'|'specialization-feature'|'feat'|'neutral'} ChipVariant
 */
export type ChipVariant =
  | 'boon'
  | 'vocation-feature'
  | 'specialization-feature'
  | 'feat'
  | 'neutral';

/**
 * Props for `<Chip>`.
 *
 * @interface ChipProps
 * @property {string} label - Visible text label
 * @property {ChipVariant} [variant] - Visual variant (default `neutral`)
 * @property {ReactNode} [icon] - Optional leading icon
 * @property {() => void} [onRemove] - Optional remove handler; renders an `×` button when set
 * @property {() => void} [onClick] - Optional click handler for the chip body
 * @property {string} [removeLabel] - Accessible label for the remove button
 * @property {string} [title] - HTML title tooltip
 */
export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  removeLabel?: string;
  title?: string;
}

/**
 * Compact pill-style label.
 *
 * @component
 * @param {ChipProps} props - Component props
 * @returns {JSX.Element} Rendered chip
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'neutral',
  icon,
  onRemove,
  onClick,
  removeLabel,
  title,
}) => {
  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRemove?.();
  };

  const interactive = !!onClick;
  const className = `${styles.chip} ${styles[variant] ?? ''} ${
    interactive ? styles.interactive : ''
  }`;

  return (
    <span className={styles.chipWrapper}>
      {interactive ? (
        <button
          type='button'
          className={className}
          onClick={onClick}
          title={title}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.label}>{label}</span>
        </button>
      ) : (
        <span className={className} title={title}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.label}>{label}</span>
        </span>
      )}
      {onRemove && (
        <button
          type='button'
          className={styles.removeBtn}
          onClick={handleRemove}
          aria-label={removeLabel ?? `Remove ${label}`}>
          <X size={12} aria-hidden='true' />
        </button>
      )}
    </span>
  );
};
