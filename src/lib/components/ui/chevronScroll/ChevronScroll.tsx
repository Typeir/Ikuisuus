/**
 * @fileoverview ChevronScroll Component
 * @description Wraps a horizontal strip in a scroll container flanked by
 * always-visible left/right chevron buttons. Chevrons scroll by a fixed step and
 * disable at the scroll edges. Native scrollbar hidden. Children rendered unchanged.
 *
 * Consumers may set `--chevron-scroll-max` (visible strip cap) and
 * `--chevron-scroll-bleed` (scrollport padding for transforms that overhang
 * the items) via `className`.
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
 * @property {'always' | 'auto'} [chevrons='always'] - `auto` mounts the chevrons only while the strip overflows
 * @property {'md' | 'sm'} [size='md'] - `sm` fits the chevrons into a single text row
 */
export interface ChevronScrollProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  chevrons?: 'always' | 'auto';
  size?: 'md' | 'sm';
}

/**
 * Horizontal scroller with flanking chevron buttons for overflowing strips.
 *
 * @component
 * @param {ChevronScrollProps} props - Component props
 * @param {ReactNode} props.children - The horizontal strip to make scrollable
 * @param {string} [props.className] - Extra class merged onto the wrapper
 * @param {string} [props.ariaLabel] - Accessible label; exposes the scroller as a `tablist`
 * @param {'always' | 'auto'} [props.chevrons='always'] - `auto` mounts the chevrons only while the strip overflows
 * @param {'md' | 'sm'} [props.size='md'] - `sm` fits the chevrons into a single text row
 * @returns {JSX.Element} The chevron-flanked scroll container
 */
export const ChevronScroll: React.FC<ChevronScrollProps> = ({
  children,
  className = '',
  ariaLabel,
  chevrons = 'always',
  size = 'md',
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const overflow = scroller.scrollWidth - scroller.clientWidth;
    setOverflowing(overflow > 1);
    setCanScrollLeft(overflow > 1 && scroller.scrollLeft > 1);
    setCanScrollRight(overflow > 1 && scroller.scrollLeft < overflow - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScrollState)
        : null;
    observer?.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer?.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: CHEVRON_SCROLL_STEP * direction,
      behavior: 'smooth',
    });
  }, []);

  const showChevrons = chevrons === 'always' || overflowing;
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <div
      className={`${styles.wrapper} ${size === 'sm' ? styles.sm : ''} ${className}`.trim()}>
      {showChevrons && (
        <button
          type='button'
          className={styles.chevron}
          onClick={() => scrollByStep(-1)}
          disabled={!canScrollLeft}
          aria-label='Scroll left'
          tabIndex={-1}>
          <ChevronLeft size={iconSize} aria-hidden='true' />
        </button>
      )}
      <div
        className={styles.scroller}
        ref={scrollerRef}
        role={ariaLabel ? 'tablist' : undefined}
        aria-label={ariaLabel}>
        {children}
      </div>
      {showChevrons && (
        <button
          type='button'
          className={styles.chevron}
          onClick={() => scrollByStep(1)}
          disabled={!canScrollRight}
          aria-label='Scroll right'
          tabIndex={-1}>
          <ChevronRight size={iconSize} aria-hidden='true' />
        </button>
      )}
    </div>
  );
};
