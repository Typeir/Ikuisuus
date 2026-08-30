/**
 * Numeric Input Component
 * 
 * @fileoverview Controlled numeric input. Clamps to min/max on blur; empties on non-finite
 * values; optional step buttons and clear button.
 * 
 * @module numericInput
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @description
 * Controlled numeric input with on-blur clamping, optional step buttons, clear button,
 * and role="spinbutton" ARIA. Supports size variants and optional decimals.
 * 
 * Value Handling:
 * - null, undefined, NaN, and non-finite values render as empty input ("").
 * - Empty input produces `undefined` in onChange callback.
 * - Valid finite numbers are displayed as-is.
 * - The component never renders literal "null", "undefined", or "NaN" strings.
 * - Edited text is held as a draft; in-bounds values commit live, invalid drafts
 *   commit on blur after parsing and clamping.
 * 
 * @example
 * // Basic usage
 * <NumericInput
 *   value={hp}
 *   onChange={setHp}
 *   min={0}
 *   max={999}
 *   ariaLabel="Hit points"
 * />
 * 
 * @example
 * // With step buttons and clear
 * <NumericInput
 *   value={quantity}
 *   onChange={setQuantity}
 *   showButtons
 *   showClear
 *   step={5}
 * />
 */

'use client';

import {
  useCallback,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import { IconButton } from '@/lib/components/ui/iconButton';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './numericInput.module.scss';

/**
 * Checks if a value is a valid, displayable number.
 * Returns false for null, undefined, NaN, Infinity, and -Infinity.
 * 
 * @function isValidDisplayNumber
 * @param {number | null | undefined} value - The value to check
 * @returns {boolean} True if value is a finite number that can be displayed
 * @since 1.1.0
 */
function isValidDisplayNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

/**
 * Props for NumericInput component
 * 
 * @interface NumericInputProps
 * @description Configuration options for the NumericInput component.
 * @property {string} [id] - Unique ID for the input element
 * @property {number | undefined} value - Current numeric value (undefined for empty)
 * @property {function} onChange - Callback when value changes, receives number or undefined
 * @property {string} [placeholder] - Placeholder text shown when empty
 * @property {number} [min] - Minimum allowed value (clamped on blur)
 * @property {number} [max] - Maximum allowed value (clamped on blur)
 * @property {number} [step=1] - Step increment for arrow keys and buttons
 * @property {boolean} [disabled=false] - Whether the input is disabled
 * @property {string} [ariaLabel] - Accessible label for screen readers
 * @property {string} [className] - CSS class for the container
 * @property {boolean} [showClear=false] - Whether to show clear button
 * @property {boolean} [showButtons=false] - Whether to show flanking increment/decrement buttons
 * @property {boolean} [showChevrons=false] - Whether to show a stacked chevron spinner column
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Input width preset
 * @property {boolean} [allowDecimals=false] - Whether to allow decimal values
 * @property {boolean} [selectOnFocus=false] - Select all text on focus
 */
export interface NumericInputProps {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  showClear?: boolean;
  showButtons?: boolean;
  showChevrons?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowDecimals?: boolean;
  selectOnFocus?: boolean;
}

/**
 * Controlled numeric input with min/max validation.
 * 
 * @component
 * @param {NumericInputProps} props - Configuration for numeric input behavior
 * @property {(value: number | undefined) => void} props.onChange - Callback fired when value changes
 * @example
 * ```tsx
 * <NumericInput
 *   id="min-hp"
 *   value={minHp}
 *   onChange={setMinHp}
 *   placeholder="Min"
 *   min={0}
 *   max={1000}
 *   ariaLabel="Minimum HP filter"
 * />
 * ```
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  {
    id,
    value,
    onChange,
    placeholder = '',
    min,
    max,
    step = 1,
    disabled = false,
    ariaLabel,
    className = '',
    showClear = false,
    showButtons = false,
    showChevrons = false,
    size = 'md',
    allowDecimals = false,
    selectOnFocus = false,
  },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  useImperativeHandle(forwardedRef, () => inputRef.current!);

  const parseValue = useCallback((text: string): number | undefined => {
    if (!text.trim()) return undefined;
    
    const parsed = allowDecimals ? parseFloat(text) : parseInt(text, 10);
    if (isNaN(parsed)) return undefined;
    
    return parsed;
  }, [allowDecimals]);

  const clampValue = useCallback((val: number | undefined): number | undefined => {
    if (val === undefined) return undefined;
    
    let clamped = val;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    
    return clamped;
  }, [min, max]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (!regex.test(text)) return;
    setDraft(text);
    const parsed = parseValue(text);
    const inBounds =
      parsed !== undefined &&
      (min === undefined || parsed >= min) &&
      (max === undefined || parsed <= max);
    if (inBounds) onChange(parsed);
  }, [onChange, parseValue, allowDecimals, min, max]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const pending = draft !== null ? parseValue(draft) : value;
    setDraft(null);
    onChange(clampValue(pending));
  }, [draft, value, onChange, clampValue, parseValue]);

  const handleStep = useCallback((direction: 1 | -1) => {
    const current = value ?? (min !== undefined ? min : 0);
    const newValue = current + (step * direction);
    setDraft(null);
    onChange(clampValue(newValue));
    inputRef.current?.focus();
  }, [value, min, step, onChange, clampValue]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        handleStep(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleStep(-1);
        break;
      case 'Escape':
        e.preventDefault();
        setDraft(null);
        onChange(undefined);
        break;
    }
  }, [handleStep, onChange]);

  const handleClear = useCallback(() => {
    setDraft(null);
    onChange(undefined);
    inputRef.current?.focus();
  }, [onChange]);

  const displayValue =
    draft !== null ? draft : isValidDisplayNumber(value) ? String(value) : '';

  return (
    <div 
      className={`${styles.numericInput} ${styles[size]} ${className} ${isFocused ? styles.focused : ''}`}
    >
      {showButtons && (
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => handleStep(-1)}
          disabled={disabled || (min !== undefined && value !== undefined && value <= min)}
          aria-label="Decrease value"
          tabIndex={-1}
        >
          −
        </button>
      )}
      
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        className={styles.input}
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          if (selectOnFocus) e.currentTarget.select();
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        role="spinbutton"
      />

      {showClear && value !== undefined && !disabled && (
        <IconButton
          kind='close'
          label='Clear value'
          onClick={handleClear}
          tabIndex={-1}
        />
      )}

      {showButtons && (
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => handleStep(1)}
          disabled={disabled || (max !== undefined && value !== undefined && value >= max)}
          aria-label="Increase value"
          tabIndex={-1}
        >
          +
        </button>
      )}

      {showChevrons && (
        <span className={styles.chevronColumn} aria-hidden={disabled}>
          <button
            type="button"
            className={styles.chevronButton}
            onClick={() => handleStep(1)}
            disabled={disabled || (max !== undefined && value !== undefined && value >= max)}
            aria-label="Increase value"
            tabIndex={-1}
          >
            <ChevronUp size={12} aria-hidden='true' />
          </button>
          <button
            type="button"
            className={styles.chevronButton}
            onClick={() => handleStep(-1)}
            disabled={disabled || (min !== undefined && value !== undefined && value <= min)}
            aria-label="Decrease value"
            tabIndex={-1}
          >
            <ChevronDown size={12} aria-hidden='true' />
          </button>
        </span>
      )}
    </div>
  );
});

export default NumericInput;
