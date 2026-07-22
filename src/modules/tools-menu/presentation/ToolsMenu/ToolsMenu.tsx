/**
 * Tools Menu Component
 *
 * @fileoverview Button-triggered dropdown menu for sidebar tools navigation.
 * Implements keyboard navigation and click-outside-to-close behavior.
 *
 * @component ToolsMenu
 * @version 2.1.0
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

import { ChevronUp } from 'lucide-react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { ToolMenuItem } from '../../domain/toolMenuItem.types';
import styles from './ToolsMenu.module.scss';

/**
 * Props for ToolsMenu component
 *
 * @interface ToolsMenuProps
 * @property {ToolMenuItem[]} items - Array of menu items to display
 * @property {(item: ToolMenuItem) => void} onSelect - Callback when item is selected
 * @property {ReactNode} trigger - Custom trigger button content (icon + text)
 * @property {boolean} [closeOnClickOutside=false] - Whether to close menu when clicking outside
 */
interface ToolsMenuProps {
  items: ToolMenuItem[];
  onSelect: (item: ToolMenuItem) => void;
  trigger: ReactNode;
  closeOnClickOutside?: boolean;
}

/**
 * Tools menu component with keyboard navigation
 *
 * @component
 * @param {ToolsMenuProps} props - Component props
 * @param {ToolMenuItem[]} props.items - Array of menu items to display
 * @param {(item: ToolMenuItem) => void} props.onSelect - Callback when an item is selected
 * @param {ReactNode} props.trigger - Custom trigger button content (icon + text)
 * @param {boolean} [props.closeOnClickOutside=false] - Whether to close menu when clicking outside
 * @returns {JSX.Element} Rendered menu with button trigger and dropdown
 *
 * @description
 * Button-triggered menu for tool navigation. Supports:
 * - Arrow key navigation (up/down)
 * - Enter/Space to select
 * - Escape to close
 * - Optional click outside to close
 * - Mouse hover selection
 */
export function ToolsMenu({
  items,
  onSelect,
  trigger,
  closeOnClickOutside = false,
}: ToolsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close, closeOnClickOutside]);

  const handleSelect = useCallback(
    (item: ToolMenuItem) => {
      onSelect(item);
      close();
      setSelectedIndex(0);
    },
    [onSelect, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          close();
          buttonRef.current?.focus();
          break;
      }
    },
    [isOpen, items, selectedIndex, handleSelect, close],
  );

  return (
    <div className={styles.toolsMenu}>
      <button
        ref={buttonRef}
        type='button'
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup='menu'>
        {trigger}
        <ChevronUp size={16} className={styles.caret} aria-hidden='true' />
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown} role='menu'>
          <ul className={styles.list}>
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`${styles.listItem} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                role='menuitem'
                tabIndex={-1}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
