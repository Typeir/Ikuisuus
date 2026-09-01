/**
 * @fileoverview Shared Search Field
 * @description The root search's input chrome as a reusable field: underline
 * console styling, search icon, optional hint and loading pulse. SearchBar and
 * embedded surfaces (metadata tables) render the same field.
 *
 * @module modules/search/presentation/SearchField/SearchField
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { Search } from 'lucide-react';
import type { InputHTMLAttributes, JSX, Ref } from 'react';
import styles from './SearchField.module.scss';

/**
 * Props for {@link SearchField}.
 *
 * @interface SearchFieldProps
 * @property {string} value - Current input value
 * @property {(value: string) => void} [onChange] - Value change handler; runs before any `inputProps.onChange`
 * @property {string} [placeholder] - Input placeholder
 * @property {string} [ariaLabel] - Accessible name for the input
 * @property {'bar' | 'hero'} [variant] - Visual variant (default `'bar'`)
 * @property {boolean} [loading] - Pulses the icon while a query is in flight
 * @property {string} [hint] - Trailing hint text, e.g. a shortcut chip
 * @property {string} [className] - Extra class for the wrapper
 * @property {Ref<HTMLInputElement>} [inputRef] - Ref forwarded to the input element
 * @property {InputHTMLAttributes<HTMLInputElement>} [inputProps] - Extra input attributes and handlers (combobox wiring)
 */
export interface SearchFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  variant?: 'bar' | 'hero';
  loading?: boolean;
  hint?: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Search input field with the root search's console styling.
 *
 * @param {SearchFieldProps} props - Component props
 * @returns {JSX.Element} The field
 *
 * @example
 * <SearchField value={term} onChange={setTerm} placeholder='Search…' />
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  variant = 'bar',
  loading = false,
  hint,
  className,
  inputRef,
  inputProps,
}: SearchFieldProps): JSX.Element {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
    inputProps?.onChange?.(event);
  };

  return (
    <div
      className={cn(
        styles.field,
        variant === 'hero' && styles.hero,
        loading && styles.loading,
        className,
      )}>
      <input
        ref={inputRef}
        type='search'
        className={styles.input}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete='off'
        {...inputProps}
        value={value}
        onChange={handleChange}
      />
      {hint && <span className={styles.hint}>{hint}</span>}
      <Search size={16} className={styles.icon} aria-hidden='true' />
    </div>
  );
}
