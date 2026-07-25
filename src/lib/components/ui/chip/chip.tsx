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

import { HelpCircle, X } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import styles from './chip.module.scss';

/**
 * Visual variant. Each variant maps to a CSS class that picks a tinted
 * background + accent border via existing CSS variables.
 *
 * @typedef {'boon'|'vocation-feature'|'specialization-feature'|'feat'|'neutral'|'success'|'warning'|'danger'} ChipVariant
 */
export type ChipVariant =
  | 'boon'
  | 'vocation-feature'
  | 'specialization-feature'
  | 'feat'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Props for `<Chip>`.
 *
 * @interface ChipProps
 * @property {string} label - Visible text label
 * @property {ChipVariant} [variant] - Visual variant (default `neutral`)
 * @property {ReactNode} [icon] - Optional leading icon
 * @property {() => void} [onInfo] - Optional info handler; renders a `?` button inside the chip when set
 * @property {() => void} [onRemove] - Optional remove handler; renders an `×` button inside the chip when set
 * @property {() => void} [onClick] - Optional click handler for the chip body
 * @property {string} [infoLabel] - Accessible label for the info button
 * @property {string} [removeLabel] - Accessible label for the remove button
 * @property {string} [title] - HTML title tooltip
 */
export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: ReactNode;
  onInfo?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  infoLabel?: string;
  removeLabel?: string;
  title?: string;
}

/**
 * Compact pill-style label.
 *
 * @component
 * @param {ChipProps} props - Component props
 * @param {string} props.label - Visible text label
 * @param {ChipVariant} [props.variant='neutral'] - Visual variant (default `neutral`)
 * @param {ReactNode} [props.icon] - Optional leading icon
 * @param {() => void} [props.onInfo] - Optional info handler; renders a `?` button inside the chip when set
 * @param {() => void} [props.onRemove] - Optional remove handler; renders an `×` button inside the chip when set
 * @param {() => void} [props.onClick] - Optional click handler for the chip body
 * @param {string} [props.infoLabel] - Accessible label for the info button
 * @param {string} [props.removeLabel] - Accessible label for the remove button
 * @param {string} [props.title] - HTML title tooltip
 * @returns {JSX.Element} Rendered chip
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'neutral',
  icon,
  onInfo,
  onRemove,
  onClick,
  infoLabel,
  removeLabel,
  title,
}) => {
  const handleInfo = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onInfo?.();
  };

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRemove?.();
  };

  const interactive = !!onClick;
  const className = `${styles.chip} ${styles[variant] ?? ''} ${
    interactive ? styles.interactive : ''
  }`;

  const innerContent = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {onInfo && (
        <button
          type='button'
          className={styles.infoBtn}
          onClick={handleInfo}
          aria-label={infoLabel ?? `Info for ${label}`}>
          <HelpCircle size={11} aria-hidden='true' />
        </button>
      )}
      {onRemove && (
        <button
          type='button'
          className={styles.removeBtn}
          onClick={handleRemove}
          aria-label={removeLabel ?? `Remove ${label}`}>
          <X size={11} aria-hidden='true' />
        </button>
      )}
    </>
  );

  return (
    <span className={styles.chipWrapper}>
      {interactive ? (
        <button
          type='button'
          className={className}
          onClick={onClick}
          title={title}>
          {innerContent}
        </button>
      ) : (
        <span className={className} title={title}>
          {innerContent}
        </span>
      )}
    </span>
  );
};
