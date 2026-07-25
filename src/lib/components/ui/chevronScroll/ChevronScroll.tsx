/**
 * @fileoverview ChevronScroll Component
 * @description Wraps a horizontal strip (e.g. a tab row) in a scroll container
 * flanked by always-visible left/right chevron buttons. The chevrons scroll the
 * strip by a fixed step and disable when the strip is at (or cannot reach) that
 * edge. The native scrollbar is hidden — the chevrons are the affordance. Content
 * is passed as children and rendered unchanged, so callers keep their own tab
 * markup and styling.
 *
 * @module lib/components/ui/chevronScroll/ChevronScroll
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './ChevronScroll.module.scss';

/**
 * Horizontal distance in pixels scrolled per chevron activation.
 */
const CHEVRON_SCROLL_STEP = 140;

/**
 * Props for the ChevronScroll component.
 *
 * @interface ChevronScrollProps
 * @property {ReactNode} children - The horizontal strip to make scrollable
 * @property {string} [className] - Extra class merged onto the wrapper (e.g. for a bottom border)
 * @property {string} [ariaLabel] - Accessible label; when set, the scroller is exposed as a `tablist`
 */
export interface ChevronScrollProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Horizontal scroller with flanking chevron buttons for overflowing strips.
 *
 * @component
 * @param {ChevronScrollProps} props - Component props
 * @param {ReactNode} props.children - The horizontal strip to make scrollable
 * @param {string} [props.className] - Extra class merged onto the wrapper
 * @param {string} [props.ariaLabel] - Accessible label; exposes the scroller as a `tablist`
 * @returns {JSX.Element} The chevron-flanked scroll container
 */
export const ChevronScroll: React.FC<ChevronScrollProps> = ({
  children,
  className = '',
  ariaLabel,
}) => {
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
    updateScrollState();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      scroller.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: CHEVRON_SCROLL_STEP * direction,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <button
        type='button'
        className={styles.chevron}
        onClick={() => scrollByStep(-1)}
        disabled={!canScrollLeft}
        aria-label='Scroll left'
        tabIndex={-1}>
        <ChevronLeft size={16} aria-hidden='true' />
      </button>
      <div
        className={styles.scroller}
        ref={scrollerRef}
        role={ariaLabel ? 'tablist' : undefined}
        aria-label={ariaLabel}>
        {children}
      </div>
      <button
        type='button'
        className={styles.chevron}
        onClick={() => scrollByStep(1)}
        disabled={!canScrollRight}
        aria-label='Scroll right'
        tabIndex={-1}>
        <ChevronRight size={16} aria-hidden='true' />
      </button>
    </div>
  );
};
