/**
 * @fileoverview Generic Combobox Component
 * @description Searchable dropdown with keyboard navigation, ARIA attributes,
 * click-outside-to-close, and viewport-aware positioning. Dropdown renders to
 * document.body via React Portal, escaping ancestor overflow clipping.
 *
 * @module modules/encounter-planner/presentation/comboboxes/genericCombobox
 * @version 2.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state, effects, and refs
 * @requires react-dom Portal rendering for dropdown
 * @requires ./combobox.module.scss Shared combobox styles
 *
 * @example
 * ```tsx
 * <GenericCombobox
 *   items={myItems}
 *   isLoading={false}
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   onSelect={handleSelect}
 *   placeholder="Search..."
 *   noResultsMessage="No results"
 *   renderItem={(item) => <div>{item.title}</div>}
 * />
 * ```
 */

'use client';

import {
  ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '@/lib/hooks/useMounted';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import {
  toAnchorName,
  useAnchoredPosition,
  useCssAnchorSupport,
} from '@/lib/hooks/useAnchoredPosition';
import styles from './combobox.module.scss';
import {
    DROPDOWN_MAX_HEIGHT,
    DROPDOWN_MIN_WIDTH,
    OFFSET_Y,
    VIEWPORT_MARGIN,
} from './comboboxConstants';

/**
 * Base interface for combobox items; item types extend it for GenericCombobox compatibility.
 *
 * @interface ComboboxItem
 * @property {string} id - Unique identifier for the item
 * @property {string} searchableText - Text used for filtering (case-insensitive)
 */
export interface ComboboxItem {
  id: string;
  searchableText: string;
}

/**
 * Props for GenericCombobox component
 * @interface GenericComboboxProps
 * @template T - Item type extending ComboboxItem
 */
interface GenericComboboxProps<T extends ComboboxItem> {
  items: T[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (item: T) => void;
  placeholder: string;
  noResultsMessage: string;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  filterItem?: (item: T, query: string) => boolean;
}

/**
 * Combobox with keyboard navigation and search filtering; base for SpellCombobox,
 * AffixCombobox, and CreatureCombobox. Custom rendering and filtering via props.
 *
 * @component
 * @template T - Item type extending ComboboxItem
 * @param {GenericComboboxProps<T>} props - Component props
 * @param {T[]} props.items - Array of items to display in the dropdown
 * @param {boolean} props.isLoading - Whether items are currently being loaded
 * @param {string} props.searchQuery - Current search input value
 * @param {(query: string) => void} props.onSearchChange - Callback when search input changes
 * @param {(item: T) => void} props.onSelect - Callback when an item is selected
 * @param {string} props.placeholder - Placeholder text for the search input
 * @param {string} props.noResultsMessage - Message displayed when no items match
 * @param {(item: T, isSelected: boolean) => ReactNode} props.renderItem - Custom renderer for dropdown items
 * @param {(item: T, query: string) => boolean} [props.filterItem] - Optional custom filter function
 * @returns {JSX.Element} Rendered combobox with input and dropdown
 *
 * @example
 * ```tsx
 * <GenericCombobox
 *   items={monsters}
 *   searchQuery={search}
 *   onSearchChange={setSearch}
 *   onSelect={(monster) => console.log(monster.slug)}
 *   renderItem={(m) => <div>{m.title}</div>}
 * />
 * ```
 */
export function GenericCombobox<T extends ComboboxItem>({
  items,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelect,
  placeholder,
  noResultsMessage,
  renderItem,
  filterItem,
}: GenericComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const compute = useCallback((rect: DOMRect, dropdown: HTMLElement) => {
    const width = Math.max(rect.width, DROPDOWN_MIN_WIDTH);
    dropdown.style.width = `${width}px`;

    let left = rect.left;
    if (left + width > window.innerWidth) {
      left = Math.max(0, window.innerWidth - width - VIEWPORT_MARGIN);
    }

    const spaceBelow = window.innerHeight - rect.bottom - OFFSET_Y;
    const spaceAbove = rect.top - OFFSET_Y;
    const top =
      spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow
        ? rect.top - Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove)
        : rect.bottom + OFFSET_Y;

    return { x: left, y: top };
  }, []);

  const cssAnchored = useCssAnchorSupport();
  const anchorName = toAnchorName(useId());

  useAnchoredPosition(inputRef, dropdownRef, compute, {
    active: !cssAnchored && isOpen,
  });

  const defaultFilter = useCallback((item: T, query: string) => {
    return item.searchableText.toLowerCase().includes(query.toLowerCase());
  }, []);

  const filterFn = filterItem || defaultFilter;

  const filteredItems = searchQuery.trim()
    ? items.filter((item) => filterFn(item, searchQuery))
    : items;

  useOutsideClick([inputRef, dropdownRef], () => setIsOpen(false));

  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      onSearchChange('');
      setIsOpen(false);
      setSelectedIndex(0);
    },
    [onSelect, onSearchChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, filteredItems, selectedIndex, handleSelect],
  );

  const listboxId = `combobox-listbox-${useRef(Math.random().toString(36).slice(2, 9)).current}`;
  const activeDescendantId =
    isOpen && filteredItems[selectedIndex]
      ? `${listboxId}-option-${selectedIndex}`
      : undefined;

  return (
    <div className={styles.combobox}>
      <input
        ref={inputRef}
        type='text'
        role='combobox'
        style={{ anchorName } as CSSProperties}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendantId}
        aria-autocomplete='list'
        aria-haspopup='listbox'
        className={styles.input}
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setIsOpen(true);
          setSelectedIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? 'Loading...' : placeholder}
        disabled={isLoading}
      />

      {isOpen &&
        isMounted &&
        createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            role='listbox'
            aria-label={placeholder}
            className={styles.dropdown}
            style={
              (cssAnchored
                ? { positionAnchor: anchorName }
                : { transform: 'translate3d(0, 0, 0)', willChange: 'transform' }) as CSSProperties
            }>
            {filteredItems.length === 0 ? (
              <div className={styles.noResults} role='status'>
                {noResultsMessage}
              </div>
            ) : (
              <ul className={styles.list}>
                {filteredItems.map((item, index) => (
                  <li
                    key={item.id}
                    id={`${listboxId}-option-${index}`}
                    role='option'
                    aria-selected={index === selectedIndex}
                    className={`${styles.listItem} ${
                      index === selectedIndex ? styles.selected : ''
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}>
                    {renderItem(item, index === selectedIndex)}
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
