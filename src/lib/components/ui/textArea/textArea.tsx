/**
 * @fileoverview Text Area Component
 * @description Accessible styled textarea replacing raw `<textarea>`.
 * Supports rows, disabled, and readOnly states.
 *
 * @module lib/components/ui/textArea
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { ChangeEvent } from 'react';
import styles from './textArea.module.scss';

/**
 * Props for the TextArea component.
 *
 * @interface TextAreaProps
 * @property {string} value - Controlled textarea value
 * @property {(value: string) => void} onChange - Change callback with the new string value
 * @property {string} [id] - Textarea id attribute
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [ariaLabel] - Accessible label when no visible label is present
 * @property {string} [className] - Additional class applied to the textarea element
 * @property {boolean} [disabled] - Disables the textarea
 * @property {boolean} [readOnly] - Makes the textarea read-only
 * @property {number} [rows] - Number of visible rows (default `3`)
 */
export interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
}

/**
 * Styled accessible textarea.
 *
 * @component
 * @param {TextAreaProps} props - Component props
 * @returns {JSX.Element} Rendered textarea
 */
export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  className,
  disabled = false,
  readOnly = false,
  rows = 3,
}) => {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const classes = [styles.textArea, className].filter(Boolean).join(' ');

  return (
    <textarea
      id={id}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows}
      className={classes}
    />
  );
};

export default TextArea;
