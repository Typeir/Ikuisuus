/**
 * @fileoverview Filter Select Parts
 * @description Option row renderer and mobile bottom-sheet modal for FilterSelect.
 *
 * @module lib/components/ui/filterSelect/filterSelectParts
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { memo, type ReactNode, useMemo } from 'react';
import { MobileModal } from '../modal';
import type { FilterSelectOption } from './filterSelect';
import styles from './filterSelect.module.scss';

/**
 * Filters options array by a search query string.
 *
 * @param {FilterSelectOption[]} options - Options to filter
 * @param {string} searchQuery - Current search query
 * @returns {FilterSelectOption[]} Filtered options matching the query
 */
export function filterOptionsByQuery(
  options: FilterSelectOption[],
  searchQuery: string,
): FilterSelectOption[] {
  if (!searchQuery.trim()) return options;
  const query = searchQuery.toLowerCase();
  return options.filter(
    (opt) => opt.value === '' || opt.label.toLowerCase().includes(query),
  );
}

/**
 * Single option row in the desktop dropdown.
 *
 * @property {FilterSelectOption} option - The option to render
 * @property {boolean} isSelected - Whether this option is currently selected
 * @property {boolean} isHighlighted - Whether this option is keyboard-highlighted
 * @property {() => void} onClick - Handler when option is clicked
 * @property {() => void} onMouseEnter - Handler when mouse enters option
 * @property {React.CSSProperties} style - CSS styles for virtualization positioning
 */
export const VirtualizedOption = memo(function VirtualizedOption({
  option,
  isSelected,
  isHighlighted,
  onClick,
  onMouseEnter,
  style,
  trailing,
  leading,
}: {
  option: FilterSelectOption;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  style: React.CSSProperties;
  trailing?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div
      role='option'
      aria-selected={isSelected}
      className={`${styles.option} ${isSelected ? styles.selected : ''} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={style}>
      {leading && <span className={styles.optionLeading}>{leading}</span>}
      <span className={styles.optionLabel}>{option.label}</span>
      {trailing && <span className={styles.optionTrailing}>{trailing}</span>}
    </div>
  );
});

/**
 * MobileModal wrapper with search input and option list for FilterSelect.
 */
export const FilterMobileModal = memo(function FilterMobileModal({
  isOpen,
  onClose,
  options,
  value,
  onSelect,
  searchQuery,
  onSearchChange,
  ariaLabel,
  allLabel,
  hideAllOption = false,
  renderLeading,
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
  hideAllOption?: boolean;
  renderLeading?: (option: FilterSelectOption) => ReactNode;
}) {
  const t = useTranslations('common');
  const filteredOptions = useMemo(
    () => filterOptionsByQuery(options, searchQuery),
    [options, searchQuery],
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={ariaLabel || t('select')}
      title={ariaLabel || t('select')}
      variant='console'
      showCloseButton>
      <div>
        <div className={styles.modalSearchContainer}>
          <input
            type='text'
            className={styles.modalSearch}
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t('searchPlaceholder')}
            autoFocus
          />
        </div>
        <div role='listbox' className={styles.modalOptionsList}>
          {!hideAllOption && (
            <div
              role='option'
              aria-selected={value === ''}
              className={`${styles.modalOption} ${value === '' ? styles.selected : ''}`}
              onClick={() => {
                onSelect('');
                onClose();
              }}>
              {allLabel}
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              role='option'
              aria-selected={value === option.value}
              className={`${styles.modalOption} ${value === option.value ? styles.selected : ''}`}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}>
              {renderLeading && (
                <span className={styles.optionLeading}>
                  {renderLeading(option)}
                </span>
              )}
              {option.label}
            </div>
          ))}
          {filteredOptions.length === 0 && searchQuery && (
            <div className={styles.noResults}>{t('noMatches')}</div>
          )}
        </div>
      </div>
    </MobileModal>
  );
});
