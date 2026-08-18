/**
 * @fileoverview Portal listbox of aspect suggestions under the search input.
 * @description Renders the `group:value` candidates as genuine aspect pills
 * (button mode) in a `document.body` portal anchored to the input, so it
 * escapes any overflow-clipped sidebar. Keyboard focus stays in the input;
 * `activeIndex` drives `aria-activedescendant`.
 *
 * @module modules/search/presentation/SearchBar/AspectSuggestions
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectPill } from '@/modules/library/presentation/components/Aspects/Aspects';
import { useLocale, useTranslations } from 'next-intl';
import {
  toAnchorName,
  useAnchoredPosition,
  useCssAnchorSupport,
} from '@/lib/hooks/useAnchoredPosition';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './searchBar.module.scss';

/**
 * Props for AspectSuggestions.
 *
 * @interface AspectSuggestionsProps
 * @property {string[]} suggestions - `group:value` tokens to offer
 * @property {number} activeIndex - Keyboard-highlighted row, -1 for none
 * @property {(index: number) => void} onPick - Called with the chosen index
 * @property {RefObject<HTMLElement | null>} anchorRef - Input to hang under
 */
export interface AspectSuggestionsProps {
  suggestions: string[];
  activeIndex: number;
  onPick: (index: number) => void;
  anchorRef: RefObject<HTMLElement | null>;
}

/**
 * Renders the suggestion listbox in a portal.
 *
 * @component
 * @param {AspectSuggestionsProps} props - Component props
 * @returns {JSX.Element | null} The listbox, or null before mount / without candidates
 */
export function AspectSuggestions({
  suggestions,
  activeIndex,
  onPick,
  anchorRef,
}: AspectSuggestionsProps): JSX.Element | null {
  const t = useTranslations('search');
  const locale = useLocale();
  const listRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const compute = useCallback((rect: DOMRect, list: HTMLElement) => {
    list.style.minWidth = `${rect.width}px`;
    return { x: rect.left, y: rect.bottom + 4 };
  }, []);

  const hasAnchor = isMounted && anchorRef.current !== null;
  const cssAnchored = useCssAnchorSupport();
  const anchorName = toAnchorName(useId());

  useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!cssAnchored || !el) return;
    el.style.setProperty('anchor-name', anchorName);
    return () => {
      el.style.removeProperty('anchor-name');
    };
  }, [anchorRef, anchorName, cssAnchored, hasAnchor]);

  useAnchoredPosition(anchorRef, listRef, compute, {
    active: !cssAnchored && hasAnchor && suggestions.length > 0,
  });

  if (!hasAnchor || suggestions.length === 0 || typeof document === 'undefined')
    return null;
  const parsed = displayAspects(suggestions);

  return createPortal(
    <div
      id='search-aspect-suggestions'
      role='listbox'
      aria-label={t('aspectSuggestions')}
      ref={listRef}
      className={styles.aspectSuggestions}
      style={{ positionAnchor: anchorName } as CSSProperties}>
      {parsed.map((aspect, i) => (
        <div
          key={aspect.raw}
          id={`search-aspect-${i}`}
          role='option'
          aria-selected={i === activeIndex}
          className={i === activeIndex ? styles.aspectSuggestionActive : styles.aspectSuggestion}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(i);
          }}>
          <AspectPill aspect={aspect} locale={locale} inert />
        </div>
      ))}
    </div>,
    document.body,
  );
}

export default AspectSuggestions;
