/**
 * @fileoverview Text Input Component
 * @description Accessible styled text input replacing raw `<input type="text">`.
 * Supports size variants and forwards all standard input attributes.
 *
 * @module lib/components/ui/textInput
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ChangeEvent } from 'react';
import styles from './textInput.module.scss';

/**
 * Props for the TextInput component.
 *
 * @interface TextInputProps
 * @property {string} value - Controlled input value
 * @property {(value: string) => void} onChange - Change callback with the new string value
 * @property {string} [id] - Input id attribute
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [ariaLabel] - Accessible label when no visible label is present
 * @property {string} [className] - Additional class applied to the input element
 * @property {boolean} [disabled] - Disables the input
 * @property {'sm' | 'md' | 'lg'} [size] - Size variant (default `md`)
 */
export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Styled accessible text input.
 *
 * @component
 * @param {TextInputProps} props - Component props
 * @param {string} props.value - Controlled input value
 * @param {(value: string) => void} props.onChange - Change callback with the new string value
 * @param {string} [props.id] - Input id attribute
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.ariaLabel] - Accessible label when no visible label is present
 * @param {string} [props.className] - Additional class applied to the input element
 * @param {boolean} [props.disabled=false] - Disables the input
 * @param {'sm' | 'md' | 'lg'} [props.size=md] - Size variant (default `md`)
 * @returns {JSX.Element} Rendered text input
 */
export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  className,
  disabled = false,
  size = 'md',
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : '';
  const classes = [styles.textInput, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      type='text'
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className={classes}
    />
  );
};

export default TextInput;
