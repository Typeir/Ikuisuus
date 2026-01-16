/**
 * @fileoverview Filter Select Component
 * @description Accessible, virtualized dropdown select for table filters with mobile modal support.
 * Provides consistent styling, keyboard navigation, and responsive behavior.
 * 
 * @module filterSelect
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { MobileModal } from '../modal';
import styles from './filterSelect.module.scss';

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
 * @property {string} [placeholder='Select...'] - Placeholder text when no value selected
 * @property {string} [allLabel='All'] - Label text for "All" option
 * @property {boolean} [disabled=false] - Whether the select is disabled
 * @property {string} [ariaLabel] - Accessible label for screen readers
 * @property {number} [modalThreshold=15] - Threshold for switching to modal on mobile (option count)
 * @property {string} [className] - CSS class for the container
 * @property {boolean} [searchable=false] - Whether to show search input in dropdown
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size variant
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
}

/**
 * @interface VirtualizedOptionProps
 * Props for individual virtualized option renderer
 * @property {FilterSelectOption} option - The option to render
 * @property {boolean} isSelected - Whether this option is currently selected
 * @property {boolean} isHighlighted - Whether this option is keyboard-highlighted
 * @property {() => void} onClick - Handler when option is clicked
 * @property {() => void} onMouseEnter - Handler when mouse enters option
 * @property {React.CSSProperties} style - CSS styles for virtualization positioning
 */
const VirtualizedOption = memo(function VirtualizedOption({
  option,
  isSelected,
  isHighlighted,
  onClick,
  onMouseEnter,
  style,
}: {
  option: FilterSelectOption;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  style: React.CSSProperties;
}) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={`${styles.option} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={style}
    >
      {option.label}
    </div>
  );
});

/**
 * Filter-specific modal content renderer used by FilterSelect.
 * Wraps the generic MobileModal with filter-specific search and option rendering.
 */
const FilterMobileModal = memo(function FilterMobileModal({
  isOpen,
  onClose,
  options,
  value,
  onSelect,
  searchQuery,
  onSearchChange,
  ariaLabel,
  allLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  options: FilterSelectOption[];
  value: string;
  onSelect: (value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  ariaLabel?: string;
  allLabel: string;
}) {
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={ariaLabel || 'Select option'}
      title="Select an option"
      showCloseButton
    >
      <div>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            className={styles.modalSearch}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search options"
            autoFocus
          />
        </div>
        <div role="listbox" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            role="option"
            aria-selected={value === ''}
            className={`${styles.modalOption} ${value === '' ? styles.selected : ''}`}
            onClick={() => {
              onSelect('');
              onClose();
            }}
          >
            {allLabel}
          </div>
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              className={`${styles.modalOption} ${value === option.value ? styles.selected : ''}`}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              {option.label}
            </div>
          ))}
          {filteredOptions.length === 0 && searchQuery && (
            <div className={styles.noResults}>No matches found</div>
          )}
        </div>
      </div>
    </MobileModal>
  );
});

/**
 * Accessible filter select component with mobile modal support and virtualization.
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
export const FilterSelect = forwardRef<HTMLButtonElement, FilterSelectProps>(function FilterSelect(
  {
    id,
    value,
    options,
    onChange,
    placeholder = 'Select...',
    allLabel = 'All',
    disabled = false,
    ariaLabel,
    modalThreshold = 15,
    className = '',
    searchable = false,
    size = 'md',
  },
  forwardedRef
) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [useMobileModal, setUseMobileModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /** Expose button ref for external focus management */
  useImperativeHandle(forwardedRef, () => buttonRef.current!);

  /** Determine if mobile modal should be used */
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 640;
      const hasLargeList = options.length > modalThreshold;
      setUseMobileModal(isMobileWidth && hasLargeList);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [options.length, modalThreshold]);

  /** Filter options by search query, always include 'All' option */
  const filteredOptions = useMemo(() => {
    const allOption: FilterSelectOption = { value: '', label: allLabel };
    const baseOptions = [allOption, ...options];
    
    if (!searchable || !searchQuery.trim()) return baseOptions;
    
    const query = searchQuery.toLowerCase();
    return baseOptions.filter(opt => 
      opt.value === '' || opt.label.toLowerCase().includes(query)
    );
  }, [options, allLabel, searchable, searchQuery]);

  /** Resolve display text from current value */
  const displayText = useMemo(() => {
    if (!value) return placeholder;
    const selected = options.find(opt => opt.value === value);
    return selected?.label || value;
  }, [value, options, placeholder]);

  /** Close dropdown when clicking outside */
  useEffect(() => {
    if (!isOpen || useMobileModal) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, useMobileModal]);

  /** Scroll highlighted option into view for keyboard navigation */
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) return;

    const highlighted = listRef.current.querySelector(`.${styles.highlighted}`);
    highlighted?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  const handleSelect = useCallback((newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    buttonRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
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

      default:
        if (isOpen && searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, filteredOptions, handleSelect, searchable]);

  const handleButtonClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
      if (!isOpen) {
        setHighlightedIndex(filteredOptions.findIndex(opt => opt.value === value));
      }
    }
  }, [disabled, isOpen, filteredOptions, value]);

  if (useMobileModal) {
    return (
      <div className={`${styles.filterSelect} ${className}`}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          className={`${styles.trigger} ${styles[size]} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
        >
          <span className={styles.triggerText}>{displayText}</span>
          <span className={styles.triggerIcon} aria-hidden="true">▼</span>
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
          allLabel={allLabel}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${styles.filterSelect} ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`${styles.trigger} ${styles[size]} ${disabled ? styles.disabled : ''} ${isOpen ? styles.open : ''}`}
        onClick={handleButtonClick}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-controls={isOpen ? `${id}-listbox` : undefined}
      >
        <span className={styles.triggerText}>{displayText}</span>
        <span className={styles.triggerIcon} aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <div 
          ref={listRef}
          id={`${id}-listbox`}
          className={styles.dropdown}
          role="listbox"
          aria-label={ariaLabel}
        >
          {searchable && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                aria-label="Search options"
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
              />
            ))}
            {filteredOptions.length === 0 && searchQuery && (
              <div className={styles.noResults}>No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default FilterSelect;
