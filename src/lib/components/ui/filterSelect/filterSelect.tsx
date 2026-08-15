/**
 * @fileoverview Filter Select Component
 * @description Dropdown select for table filters. Renders as a bottom sheet below 640px viewport width.
 *
 * @module filterSelect
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    forwardRef,
    KeyboardEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import styles from './filterSelect.module.scss';
import {
    FilterMobileModal,
    filterOptionsByQuery,
    VirtualizedOption,
} from './filterSelectParts';

/**
 * Viewport width below which the dropdown renders as a bottom sheet.
 */
const SHEET_VIEWPORT_QUERY = '(max-width: 640px)';

/**
 * @interface FilterSelectOption
 * Single option item in the select dropdown
 * @property {string} value - Unique identifier for the option
 * @property {string} label - Display text shown to user
 */
export interface FilterSelectOption {
  value: string;
  label: string;
}

/**
 * @interface FilterSelectProps
 * Configuration props for FilterSelect component
 * @property {string} [id] - Unique ID for ARIA relationships
 * @property {string} value - Current selected value (empty string for "All")
 * @property {FilterSelectOption[]} options - Array of available options
 * @property {(value: string) => void} onChange - Callback when value changes
 * @property {string} [placeholder] - Placeholder text when no value selected; defaults to the localized common.select string
 * @property {string} [allLabel] - Label text for "All" option; defaults to the localized common.all string
 * @property {boolean} [disabled=false] - Whether the select is disabled
 * @property {string} [ariaLabel] - Accessible label for screen readers
 * @property {number} [modalThreshold=15] - Legacy no-op; phones always use the bottom sheet regardless of option count
 * @property {string} [className] - CSS class for the container
 * @property {boolean} [searchable=false] - Whether to show search input in dropdown
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size variant
 * @property {(option: FilterSelectOption) => ReactNode} [renderOptionTrailing] - Optional renderer for trailing content inside each option row (e.g. a preview icon). Click handlers in the trailing slot must call `e.stopPropagation()` to keep the dropdown open.
 * @property {(option: FilterSelectOption) => ReactNode} [renderOptionLeading] - Optional renderer for leading content before each option label (e.g. a content-type icon)
 * @property {boolean} [hideAllOption=false] - Omit the "All" option; for action selects where every row is a concrete choice
 * @property {ReactNode} [iconTrigger] - Render the trigger as a compact icon-only button holding this node instead of the text-and-chevron trigger; pair with `ariaLabel`
 */
export interface FilterSelectProps {
  id?: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  disabled?: boolean;
  ariaLabel?: string;
  modalThreshold?: number;
  className?: string;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  renderOptionTrailing?: (option: FilterSelectOption) => ReactNode;
  renderOptionLeading?: (option: FilterSelectOption) => ReactNode;
  hideAllOption?: boolean;
  iconTrigger?: ReactNode;
}

/**
 * Select dropdown for table filters. Renders as a bottom sheet on mobile viewports.
 *
 * @component
 * @param {FilterSelectProps} props - Component configuration
 * @property {(value: string) => void} props.onChange - Callback fired when selection changes
 * @example
 * ```tsx
 * <FilterSelect
 *   id="size-filter"
 *   value={sizeFilter}
 *   options={[
 *     { value: 'small', label: 'Small' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'large', label: 'Large' },
 *   ]}
 *   onChange={setSizeFilter}
 *   placeholder="Filter by size"
 *   allLabel="All sizes"
 * />
 * ```
 */
export const FilterSelect = forwardRef<HTMLButtonElement, FilterSelectProps>(
  function FilterSelect(
    {
      id,
      value,
      options,
      onChange,
      placeholder,
      allLabel,
      disabled = false,
      ariaLabel,
      className = '',
      searchable = false,
      size = 'md',
      renderOptionTrailing,
      renderOptionLeading,
      hideAllOption = false,
      iconTrigger,
    },
    forwardedRef,
  ) {
    const t = useTranslations('common');
    const resolvedPlaceholder = placeholder ?? t('select');
    const resolvedAllLabel = allLabel ?? t('all');

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');

    /* Sheet width gate; the anchored dropdown clips on phone viewports for
       lists of any length, so the option-count threshold no longer applies. */
    const useMobileModal = useMediaQuery(SHEET_VIEWPORT_QUERY) === true;

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    /** Expose button ref for external focus management */
    useImperativeHandle(forwardedRef, () => buttonRef.current!);

    /** Filter options by search query; include 'All' unless hidden */
    const filteredOptions = useMemo(() => {
      const allOption: FilterSelectOption = {
        value: '',
        label: resolvedAllLabel,
      };
      const baseOptions = hideAllOption ? options : [allOption, ...options];

      if (!searchable || !searchQuery.trim()) return baseOptions;

      return filterOptionsByQuery(baseOptions, searchQuery);
    }, [options, resolvedAllLabel, hideAllOption, searchable, searchQuery]);

    /** Resolve display text from current value */
    const displayText = useMemo(() => {
      if (!value) return resolvedPlaceholder;
      const selected = options.find((opt) => opt.value === value);
      return selected?.label || value;
    }, [value, options, resolvedPlaceholder]);

    /** Close dropdown when clicking outside */
    useEffect(() => {
      if (!isOpen || useMobileModal) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, useMobileModal]);

    /** Scroll highlighted option into view for keyboard navigation */
    useEffect(() => {
      if (!isOpen || highlightedIndex < 0 || !listRef.current) return;

      const highlighted = listRef.current.querySelector(
        `.${styles.highlighted}`,
      );
      highlighted?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlightedIndex]);

    const handleSelect = useCallback(
      (newValue: string) => {
        onChange(newValue);
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        buttonRef.current?.focus();
      },
      [onChange],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;

        switch (e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setHighlightedIndex(0);
            } else if (
              highlightedIndex >= 0 &&
              filteredOptions[highlightedIndex]
            ) {
              handleSelect(filteredOptions[highlightedIndex].value);
            }
            break;

          case 'ArrowDown':
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setHighlightedIndex(0);
            } else {
              setHighlightedIndex((prev) =>
                prev < filteredOptions.length - 1 ? prev + 1 : prev,
              );
            }
            break;

          case 'ArrowUp':
            e.preventDefault();
            if (isOpen) {
              setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            }
            break;

          case 'Escape':
            if (isOpen) {
              e.preventDefault();
              setIsOpen(false);
              setSearchQuery('');
              buttonRef.current?.focus();
            }
            break;

          case 'Tab':
            if (isOpen) {
              setIsOpen(false);
              setSearchQuery('');
            }
            break;

          case 'Home':
            if (isOpen) {
              e.preventDefault();
              setHighlightedIndex(0);
            }
            break;

          case 'End':
            if (isOpen) {
              e.preventDefault();
              setHighlightedIndex(filteredOptions.length - 1);
            }
            break;
        }
      },
      [disabled, isOpen, highlightedIndex, filteredOptions, handleSelect],
    );

    const handleButtonClick = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setHighlightedIndex(
            filteredOptions.findIndex((opt) => opt.value === value),
          );
        }
      }
    }, [disabled, isOpen, filteredOptions, value]);

    if (useMobileModal) {
      return (
        <div
          className={`${styles.filterSelect} ${iconTrigger ? styles.iconRoot : ''} ${className}`}>
          <button
            ref={buttonRef}
            id={id}
            type='button'
            className={
              iconTrigger
                ? `${styles.iconTrigger} ${disabled ? styles.disabled : ''}`
                : `${styles.trigger} ${styles[size]} ${disabled ? styles.disabled : ''}`
            }
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            aria-haspopup='listbox'
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            title={iconTrigger ? ariaLabel : undefined}>
            {iconTrigger ?? (
              <>
                <span className={styles.triggerText}>{displayText}</span>
                <ChevronDown
                  size={14}
                  className={styles.triggerIcon}
                  aria-hidden='true'
                />
              </>
            )}
          </button>
          <FilterMobileModal
            isOpen={isOpen}
            onClose={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
            options={options}
            value={value}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ariaLabel={ariaLabel}
            allLabel={resolvedAllLabel}
            hideAllOption={hideAllOption}
            renderLeading={renderOptionLeading}
          />
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`${styles.filterSelect} ${iconTrigger ? styles.iconRoot : ''} ${className}`}
        onKeyDown={handleKeyDown}>
        <button
          ref={buttonRef}
          id={id}
          type='button'
          className={
            iconTrigger
              ? `${styles.iconTrigger} ${disabled ? styles.disabled : ''} ${isOpen ? styles.open : ''}`
              : `${styles.trigger} ${styles[size]} ${disabled ? styles.disabled : ''} ${isOpen ? styles.open : ''}`
          }
          onClick={handleButtonClick}
          disabled={disabled}
          aria-haspopup='listbox'
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          title={iconTrigger ? ariaLabel : undefined}
          aria-controls={isOpen ? `${id}-listbox` : undefined}>
          {iconTrigger ?? (
            <>
              <span className={styles.triggerText}>{displayText}</span>
              <ChevronDown
                size={14}
                className={styles.triggerIcon}
                aria-hidden='true'
              />
            </>
          )}
        </button>

        {isOpen && (
          <div
            ref={listRef}
            id={`${id}-listbox`}
            className={styles.dropdown}
            role='listbox'
            aria-label={ariaLabel}>
            {searchable && (
              <div className={styles.searchContainer}>
                <input
                  type='text'
                  className={styles.searchInput}
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  aria-label={t('searchPlaceholder')}
                  autoFocus
                />
              </div>
            )}
            <div className={styles.optionsList}>
              {filteredOptions.map((option, index) => (
                <VirtualizedOption
                  key={option.value || '__all__'}
                  option={option}
                  isSelected={value === option.value}
                  isHighlighted={index === highlightedIndex}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{}}
                  trailing={
                    option.value && renderOptionTrailing
                      ? renderOptionTrailing(option)
                      : undefined
                  }
                  leading={
                    option.value && renderOptionLeading
                      ? renderOptionLeading(option)
                      : undefined
                  }
                />
              ))}
              {filteredOptions.length === 0 && searchQuery && (
                <div className={styles.noResults}>{t('noMatches')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default FilterSelect;
