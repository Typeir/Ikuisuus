/**
 * @fileoverview GradientTabs Component
 * @description Tabbed container. Renders a scrollable tab strip above a surface
 * panel. DOM and CSS copied from SpellTable. `compact` variant tightens
 * paddings and sizes tabs for touch.
 *
 * @module lib/components/ui/gradientTabs/gradientTabs
 * @author Typeir
 * @version 1.1.0
 * @since 1.0.0
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './gradientTabs.module.scss';

/**
 * Horizontal distance in pixels scrolled per chevron activation.
 */
const CHEVRON_SCROLL_STEP = 160;

/**
 * A single tab entry.
 *
 * @interface GradientTabItem
 * @property {string} value - Unique identifier for this tab
 * @property {ReactNode} label - Content rendered inside the tab button
 * @property {boolean} [disabled] - When true, the tab button is disabled
 */
export interface GradientTabItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * Props for the GradientTabs component.
 *
 * @interface GradientTabsProps
 * @property {GradientTabItem[]} tabs - Ordered list of tab descriptors
 * @property {string} activeTab - Value of the currently selected tab
 * @property {(value: string) => void} onChange - Called when the user activates a tab
 * @property {Record<string, ReactNode>} [panels] - Map of tab value to panel content; use when all panels are declared upfront
 * @property {ReactNode} [children] - Panel content rendered directly; use when content is computed from activeTab externally
 * @property {'default' | 'compact'} [variant='default'] - Visual density; `compact` tightens paddings and sizes tabs for touch
 */
export interface GradientTabsProps {
  tabs: GradientTabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  panels?: Record<string, ReactNode>;
  children?: ReactNode;
  variant?: 'default' | 'compact';
}

/**
 * Renders a scrollable row of tab buttons above a surface panel. Scrolls the
 * active tab into view when the strip overflows horizontally.
 *
 * @component
 * @param {GradientTabsProps} props - Component props
 * @param {GradientTabItem[]} props.tabs - Ordered list of tab descriptors
 * @param {string} props.activeTab - Value of the currently selected tab
 * @param {(value: string) => void} props.onChange - Called when the user activates a tab
 * @param {Record<string, ReactNode>} [props.panels] - Map of tab value to panel content; use when all panels are declared upfront
 * @param {ReactNode} [props.children] - Panel content rendered directly; use when content is computed from activeTab externally
 * @param {'default' | 'compact'} [props.variant='default'] - Visual density; `compact` tightens paddings and sizes tabs for touch
 * @returns {JSX.Element} Rendered tabbed container
 *
 * @example
 * <GradientTabs
 *   tabs={[{ value: 'feats', label: 'Feats' }, { value: 'skills', label: 'Skills' }]}
 *   activeTab={active}
 *   onChange={setActive}
 *   panels={{ feats: <FeatsContent />, skills: <SkillsContent /> }}
 * />
 */
export const GradientTabs: React.FC<GradientTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  panels,
  children,
  variant = 'default',
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const overflow = scroller.scrollWidth - scroller.clientWidth;
    setCanScrollLeft(overflow > 1 && scroller.scrollLeft > 1);
    setCanScrollRight(overflow > 1 && scroller.scrollLeft < overflow - 1);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`.${styles.active}`);
    active?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }, [activeTab]);

  useEffect(() => {
    updateScrollState();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      scroller.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, tabs]);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: CHEVRON_SCROLL_STEP * direction,
      behavior: 'smooth',
    });
  }, []);

  const isCompact = variant === 'compact';
  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <>
      <div
        className={`${styles.gradientContainer} ${isCompact ? styles.compact : ''}`}>
        {hasOverflow && (
          <button
            type='button'
            className={`${styles.navChevron} ${styles.navChevronLeft}`}
            onClick={() => scrollByStep(-1)}
            disabled={!canScrollLeft}
            aria-label='Scroll tabs left'
            tabIndex={-1}>
            <ChevronLeft size={18} aria-hidden='true' />
          </button>
        )}
        <div className={styles.tabNavWrapper} ref={scrollerRef}>
          <div className={styles.tabNav}>
            <div className={styles.tabList} ref={listRef}>
              {tabs.map((tab) => (
                <div
                  key={tab.value}
                  className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}>
                  <button
                    type='button'
                    disabled={tab.disabled}
                    onClick={() => onChange(tab.value)}>
                    {tab.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {hasOverflow && (
          <button
            type='button'
            className={`${styles.navChevron} ${styles.navChevronRight}`}
            onClick={() => scrollByStep(1)}
            disabled={!canScrollRight}
            aria-label='Scroll tabs right'
            tabIndex={-1}>
            <ChevronRight size={18} aria-hidden='true' />
          </button>
        )}
      </div>

      <div
        className={`${styles.tabContent} ${isCompact ? styles.compactContent : ''}`}>
        {panels ? panels[activeTab] : children}
      </div>
    </>
  );
};
