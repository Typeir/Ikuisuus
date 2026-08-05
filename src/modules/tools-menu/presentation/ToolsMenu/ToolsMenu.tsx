/**
 * Tools Menu Component
 *
 * @fileoverview Button-triggered dropdown menu for sidebar tools navigation,
 * following the ARIA menu button pattern.
 *
 * Focus moves into the menu when it opens and rides the active item, so the
 * item a keyboard or screen-reader user is on is the focused element rather
 * than a purely visual highlight. Dismissal is handled for every route out of
 * the menu: pointer press outside, Escape, Tab, and focus leaving by any other
 * means. Escape and selection return focus to the trigger; dismissals that
 * move focus elsewhere leave it where the user put it.
 *
 * Every item is an anchor carrying its own `href`, wrapped in a presentational
 * `<li>`. Menu items that navigate must be links, or middle-click, ctrl-click,
 * "open in new tab" and the link role are all lost. `onSelect` fires only for
 * an unmodified left click or a keyboard activation; the browser keeps every
 * other gesture.
 *
 * @component ToolsMenu
 * @version 4.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side hooks for state and effects
 * @requires ./ToolsMenu.module.scss Component styles
 *
 * @example
 * ```tsx
 * <ToolsMenu
 *   items={[
 *     { id: 'tool1', label: 'Tool One', href: '/tools/one' },
 *     { id: 'tool2', label: 'Tool Two', href: '/tools/two' }
 *   ]}
 *   onSelect={(item) => router.push(item.href)}
 *   trigger={<><Icon />Tools</>}
 * />
 * ```
 * @module src/modules/tools-menu/presentation/ToolsMenu/ToolsMenu
 */

'use client';

import { isPlainLeftClick } from '@/lib/utils/isPlainLeftClick';
import { ChevronUp } from 'lucide-react';
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { ToolMenuItem } from '../../domain/toolMenuItem.types';
import styles from './ToolsMenu.module.scss';

/**
 * Props for ToolsMenu component
 *
 * @interface ToolsMenuProps
 * @property {ToolMenuItem[]} items - Array of menu items to display
 * @property {(item: ToolMenuItem) => void} onSelect - Callback when item is selected
 * @property {ReactNode} trigger - Custom trigger button content (icon + text)
 * @property {string} [label] - Accessible name for the menu, announced when focus enters it
 */
interface ToolsMenuProps {
  items: ToolMenuItem[];
  onSelect: (item: ToolMenuItem) => void;
  trigger: ReactNode;
  label?: string;
}

/**
 * Tools menu component with keyboard navigation.
 *
 * @component
 * @param {ToolsMenuProps} props - Component props
 * @param {ToolMenuItem[]} props.items - Array of menu items to display
 * @param {(item: ToolMenuItem) => void} props.onSelect - Callback when an item is selected
 * @param {ReactNode} props.trigger - Custom trigger button content (icon + text)
 * @param {string} [props.label] - Accessible name for the menu
 * @returns {JSX.Element} Rendered menu with button trigger and dropdown
 *
 * @description
 * Keyboard support on the trigger:
 * - `ArrowDown`, `Enter`, `Space` open the menu at the first item
 * - `ArrowUp` opens the menu at the last item
 *
 * Keyboard support within the menu:
 * - `ArrowDown` / `ArrowUp` move between items and wrap at both ends
 * - `Home` / `End` jump to the first and last item
 * - `Enter` / `Space` activate the focused item
 * - `Escape` closes and returns focus to the trigger
 * - `Tab` closes and lets focus continue past the menu
 */
export function ToolsMenu({
  items,
  onSelect,
  trigger,
  label,
}: ToolsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const baseId = useId();
  const menuId = `${baseId}-menu`;
  const triggerId = `${baseId}-trigger`;

  const close = useCallback((returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[activeIndex]?.focus();
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current?.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (item: ToolMenuItem, event?: MouseEvent<HTMLAnchorElement>) => {
      if (event) {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
      }
      onSelect(item);
      close(true);
      setActiveIndex(0);
    },
    [onSelect, close],
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isOpen) return;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        openAt(Math.max(items.length - 1, 0));
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAt(0);
      }
    },
    [isOpen, items.length, openAt],
  );

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case 'Enter':
        case ' ': {
          event.preventDefault();
          const item = items[activeIndex];
          if (item) handleSelect(item);
          break;
        }
        case 'Escape':
          event.preventDefault();
          close(true);
          break;
        case 'Tab':
          close(false);
          break;
      }
    },
    [items, activeIndex, handleSelect, close],
  );

  return (
    <div className={styles.toolsMenu} ref={containerRef} onBlur={handleBlur}>
      <button
        ref={buttonRef}
        id={triggerId}
        type='button'
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => (isOpen ? close(false) : openAt(0))}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-controls={isOpen ? menuId : undefined}>
        {trigger}
        <ChevronUp size={16} className={styles.caret} aria-hidden='true' />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <ul
            id={menuId}
            className={styles.list}
            role='menu'
            aria-label={label}
            aria-labelledby={label ? undefined : triggerId}
            onKeyDown={handleMenuKeyDown}>
            {items.map((item, index) => (
              <li key={item.id} className={styles.listRow} role='none'>
                <a
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  href={item.href}
                  className={`${styles.listItem} ${
                    index === activeIndex ? styles.selected : ''
                  }`}
                  onClick={(event) => handleSelect(item, event)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role='menuitem'
                  tabIndex={index === activeIndex ? 0 : -1}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
