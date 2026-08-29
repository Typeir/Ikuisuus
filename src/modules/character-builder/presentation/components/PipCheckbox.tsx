/**
 * @fileoverview PipCheckbox Component
 * @description A pip-styled checkbox/radio control: an accent pip dot button
 * (filled when checked, hollow when not) with an optional inline label. Sizes:
 * `sm` (8.4px), `lg` (28px).
 * @todo TODO: move pip to shared
 * @module modules/character-builder/presentation/components/PipCheckbox
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { ReactNode } from 'react';
import pipStyles from '../CharacterSheet/proficiencyTrack.module.scss';
import styles from './PipCheckbox.module.scss';

/**
 * Props for {@link PipCheckbox}.
 *
 * @interface PipCheckboxProps
 * @property {boolean} checked - Whether the pip is filled/selected
 * @property {(checked: boolean) => void} onChange - Called with the next checked state on activation
 * @property {ReactNode} [label] - Optional inline label rendered after the pip
 * @property {string} [ariaLabel] - Accessible label; defaults to `label` when it is a string
 * @property {string} [title] - Native tooltip on the pip button
 * @property {boolean} [disabled] - Disables the control
 * @property {'checkbox' | 'radio'} [role='checkbox'] - ARIA role for the pip control
 * @property {'sm' | 'lg'} [size='sm'] - Pip size: `sm` track dot, `lg` deed pip
 * @property {string} [className] - Extra class merged onto the wrapper
 */
export interface PipCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  role?: 'checkbox' | 'radio';
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * Resolves the pip dot class for a size + checked state.
 *
 * @function pipDotClass
 * @param {'sm' | 'lg'} size - Pip size
 * @param {boolean} checked - Checked state
 * @returns {string} The CSS-module class for the dot
 */
function pipDotClass(size: 'sm' | 'lg', checked: boolean): string {
  if (size === 'lg') return styles[checked ? 'dotLg-filled' : 'dotLg-empty'];
  return pipStyles[checked ? 'trackDot-filled' : 'trackDot-empty'];
}

/**
 * Renders a pip dot control with an optional label.
 *
 * @component
 * @param {PipCheckboxProps} props - Component props
 * @param {boolean} props.checked - Whether the pip is filled/selected
 * @param {(checked: boolean) => void} props.onChange - Called with the next checked state on activation
 * @param {ReactNode} [props.label] - Optional inline label rendered after the pip
 * @param {string} [props.ariaLabel] - Accessible label; defaults to `label` when it is a string
 * @param {string} [props.title] - Native tooltip on the pip button
 * @param {boolean} [props.disabled=false] - Disables the control
 * @param {'checkbox' | 'radio'} [props.role='checkbox'] - ARIA role for the pip control
 * @param {'sm' | 'lg'} [props.size='sm'] - Pip size
 * @param {string} [props.className] - Extra class merged onto the wrapper
 * @returns {JSX.Element} The pip control
 */
export const PipCheckbox: React.FC<PipCheckboxProps> = ({
  checked,
  onChange,
  label,
  ariaLabel,
  title,
  disabled = false,
  role = 'checkbox',
  size = 'sm',
  className = '',
}) => (
  <span className={`${styles.pipCheckbox} ${className}`.trim()}>
    <button
      type='button'
      role={role}
      aria-checked={checked}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      title={title}
      disabled={disabled}
      className={pipDotClass(size, checked)}
      onClick={() => onChange(!checked)}>
      {size === 'lg' ? (
        <span aria-hidden='true'>{checked ? '⬧' : '⬨'}</span>
      ) : null}
    </button>
    {label != null && <span className={styles.pipLabel}>{label}</span>}
  </span>
);
