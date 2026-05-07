/**
 * @fileoverview Tabs Primitive
 * @description Lightweight, accessible tab system. Manages active tab state via
 * a context provider and exposes `<Tabs>`, `<TabList>`, `<Tab>`, and `<TabPanel>`
 * building blocks. Implements `role="tablist"` / `role="tab"` / `role="tabpanel"`
 * with arrow-key navigation across direct children of the tablist. Controlled
 * usage only — `value` and `onChange` are required on the root.
 *
 * @module lib/components/ui/tabs/tabs
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import styles from './tabs.module.scss';

/**
 * Internal context value passed from `<Tabs>` to children.
 *
 * @interface TabsContextValue
 * @property {string} value - Currently active tab value
 * @property {(value: string) => void} onChange - Setter invoked when a tab is activated
 * @property {string} idPrefix - Stable id prefix used for ARIA wiring
 */
interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * Read the surrounding tabs context. Throws when used outside `<Tabs>`.
 *
 * @function useTabsContext
 * @returns {TabsContextValue} The active tabs context
 */
function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs subcomponent used outside of <Tabs>');
  }
  return ctx;
}

/**
 * Props for the root `<Tabs>` component.
 *
 * @interface TabsProps
 * @property {string} value - Active tab value
 * @property {(value: string) => void} onChange - Activation callback
 * @property {ReactNode} children - `<TabList>` and `<TabPanel>`s
 * @property {string} [className] - Optional outer class
 * @property {string} [ariaLabel] - Accessible label for the tab group
 */
export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Root tabs container. Provides the active-value context to descendants.
 *
 * @component
 * @param {TabsProps} props - Component props
 * @returns {JSX.Element} Rendered tabs root
 */
export const Tabs: React.FC<TabsProps> = ({
  value,
  onChange,
  children,
  className,
  ariaLabel,
}) => {
  const idPrefix = useId();
  const ctxValue = useMemo<TabsContextValue>(
    () => ({ value, onChange, idPrefix }),
    [value, onChange, idPrefix],
  );

  return (
    <TabsContext.Provider value={ctxValue}>
      <div
        className={`${styles.tabs} ${className ?? ''}`}
        aria-label={ariaLabel}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * Props for `<TabList>`.
 *
 * @interface TabListProps
 * @property {ReactNode} children - `<Tab>` elements
 * @property {string} [ariaLabel] - Accessible label for the tablist
 */
export interface TabListProps {
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * Tab list container. Implements arrow-key navigation across direct `<Tab>`
 * children using DOM order. Activating a tab via keyboard also triggers click
 * to keep activation behaviour consistent across pointer and keyboard.
 *
 * @component
 * @param {TabListProps} props - Component props
 * @returns {JSX.Element} Rendered tablist
 */
export const TabList: React.FC<TabListProps> = ({ children, ariaLabel }) => {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])',
      ) ?? [],
    );
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex(
      (tab) => tab === document.activeElement,
    );
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex =
        currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  }, []);

  return (
    <div
      ref={listRef}
      role='tablist'
      aria-label={ariaLabel}
      className={styles.tabList}
      onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
};

/**
 * Props for `<Tab>`.
 *
 * @interface TabProps
 * @property {string} value - Tab identifier; must match a `<TabPanel value>`
 * @property {ReactNode} children - Rendered label content
 * @property {boolean} [disabled] - When true, the tab cannot be activated
 * @property {ReactNode} [icon] - Optional icon rendered before the label
 */
export interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Single selectable tab.
 *
 * @component
 * @param {TabProps} props - Component props
 * @returns {JSX.Element} Rendered tab button
 */
export const Tab: React.FC<TabProps> = ({
  value,
  children,
  disabled,
  icon,
}) => {
  const { value: active, onChange, idPrefix } = useTabsContext();
  const selected = active === value;
  const tabId = `${idPrefix}-tab-${value}`;
  const panelId = `${idPrefix}-panel-${value}`;
  return (
    <button
      type='button'
      role='tab'
      id={tabId}
      aria-controls={panelId}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      className={`${styles.tab} ${selected ? styles.active : ''}`}
      onClick={() => onChange(value)}>
      {icon && <span className={styles.tabIcon}>{icon}</span>}
      <span className={styles.tabLabel}>{children}</span>
    </button>
  );
};

/**
 * Props for `<TabPanel>`.
 *
 * @interface TabPanelProps
 * @property {string} value - Identifier matching the corresponding `<Tab>`
 * @property {ReactNode} children - Panel content
 * @property {boolean} [keepMounted] - When true, the panel stays in the DOM even when inactive (hidden via the `hidden` attribute). Useful for preserving form state across tab switches.
 */
export interface TabPanelProps {
  value: string;
  children: ReactNode;
  keepMounted?: boolean;
}

/**
 * Content panel paired with a `<Tab>`.
 *
 * @component
 * @param {TabPanelProps} props - Component props
 * @returns {JSX.Element | null} Rendered panel, or null when inactive and not kept mounted
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  children,
  keepMounted = false,
}) => {
  const { value: active, idPrefix } = useTabsContext();
  const selected = active === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role='tabpanel'
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      hidden={!selected}
      className={styles.tabPanel}>
      {children}
    </div>
  );
};
