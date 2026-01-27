/**
 * @fileoverview Generic Combobox Component
 * @description Reusable searchable dropdown with keyboard navigation and ARIA support.
 * Provides base functionality for spell, affix, and creature comboboxes.
 * Implements arrow key selection, Enter to select, Escape to close, click-outside-to-close,
 * viewport-aware positioning with scroll tracking, and full screen reader accessibility.
 *
 * Uses React Portal to render dropdown to document.body, escaping any ancestor
 * overflow clipping from scrollable containers, modals, or other stacking contexts.
 *
 * @module genericCombobox
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

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './combobox.module.scss';

const OFFSET_Y = 4;
const DROPDOWN_MIN_WIDTH = 180;
const DROPDOWN_MAX_HEIGHT = 300;
const VIEWPORT_MARGIN = 8;

/**
 * Custom hook for imperative dropdown positioning with rAF batching.
 * Directly manipulates DOM via transform for minimal layout work and zero React rerender lag.
 *
 * @param {React.RefObject<HTMLInputElement>} inputRef - Input element reference
 * @param {React.RefObject<HTMLDivElement>} dropdownRef - Dropdown element reference
 * @returns {Object} Position update functions
 */
const useRafPositioner = (
  inputRef: React.RefObject<HTMLInputElement>,
  dropdownRef: React.RefObject<HTMLDivElement>,
) => {
  const rafIdRef = useRef<number | null>(null);

  const updatePositionNow = useCallback(() => {
    const input = inputRef.current;
    const dropdown = dropdownRef.current;
    if (!input || !dropdown) return;

    const rect = input.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.max(rect.width, DROPDOWN_MIN_WIDTH);

    let top = rect.bottom + OFFSET_Y;
    let left = rect.left;

    if (left + width > viewportWidth) {
      left = Math.max(0, viewportWidth - width - VIEWPORT_MARGIN);
    }

    const spaceBelow = viewportHeight - rect.bottom - OFFSET_Y;
    const spaceAbove = rect.top - OFFSET_Y;
    if (spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow) {
      top = rect.top - Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove);
    }

    dropdown.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    dropdown.style.width = `${width}px`;
  }, [inputRef, dropdownRef]);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      updatePositionNow();
    });
  }, [updatePositionNow]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return { updatePositionNow, scheduleUpdate };
};

/**
 * Base interface for combobox items.
 * All item types must extend this interface to be compatible with GenericCombobox.
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
 * Generic combobox with keyboard navigation and search filtering.
 * Serves as base component for SpellCombobox, AffixCombobox, and CreatureCombobox.
 * Handles all interaction logic while allowing custom rendering and filtering.
 *
 * @component
 * @template T - Item type extending ComboboxItem
 * @param {GenericComboboxProps<T>} props - Component props
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
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { updatePositionNow, scheduleUpdate } = useRafPositioner(
    inputRef,
    dropdownRef,
  );

  const defaultFilter = useCallback((item: T, query: string) => {
    return item.searchableText.toLowerCase().includes(query.toLowerCase());
  }, []);

  const filterFn = filterItem || defaultFilter;

  const filteredItems = searchQuery.trim()
    ? items.filter((item) => filterFn(item, searchQuery))
    : items;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Attach scroll/resize listeners for imperative positioning.
   * Uses passive listeners and rAF batching for optimal performance.
   */
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;

    updatePositionNow();

    const scrollableAncestors: (Element | Window)[] = [];
    let element: HTMLElement | null = inputRef.current.parentElement;

    while (element) {
      const { overflow, overflowY, overflowX } =
        window.getComputedStyle(element);
      const isScrollable =
        overflow === 'auto' ||
        overflow === 'scroll' ||
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowX === 'auto' ||
        overflowX === 'scroll';

      if (isScrollable) {
        scrollableAncestors.push(element);
      }
      element = element.parentElement;
    }

    scrollableAncestors.push(window);

    scrollableAncestors.forEach((ancestor) => {
      ancestor.addEventListener('scroll', scheduleUpdate, { passive: true });
    });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      scrollableAncestors.forEach((ancestor) => {
        ancestor.removeEventListener('scroll', scheduleUpdate);
      });
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [isOpen, scheduleUpdate, updatePositionNow]);

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
            style={{
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
            }}>
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
