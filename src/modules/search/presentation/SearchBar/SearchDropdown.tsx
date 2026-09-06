/**
 * @fileoverview Dropdown for SearchBar.
 * @description Body portal anchored under the bar, rendering up to
 * MAX_DROPDOWN_RESULTS SearchResultRow items plus a full-results link.
 *
 * @module modules/search/presentation/SearchBar/SearchDropdown
 * @version 1.1.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { CSSProperties, JSX, RefObject } from 'react';
import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/classNameMerge';
import {
  useAnchorName,
  useAnchoredPosition,
} from '@/lib/hooks/useAnchoredPosition';
import { useRoomBelow } from '@/lib/hooks/useRoomBelow';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Skeleton } from '../../../../lib/components/skeleton';
import type { SearchResult } from '../../domain';
import { SearchResultRow } from '../SearchResultRow/SearchResultRow';
import styles from './searchBar.module.scss';

/** Maximum quick results to show; the final row links to the search page. */
export const MAX_DROPDOWN_RESULTS = 7;

/** Viewport edge the fallback positioning keeps clear, in px. */
const VIEWPORT_MARGIN = 16;

/** Gap between the bar and the dropdown, in px. */
const ANCHOR_GAP = 4;

/**
 * Props for the SearchDropdown component.
 *
 * @interface SearchDropdownProps
 * @property {SearchResult[]} results - Search results
 * @property {boolean} loading - Whether a search is in flight
 * @property {number} activeIndex - Index of the currently highlighted result
 * @property {() => void} onNavigate - Callback when a result link is clicked
 * @property {string} searchHref - Full-results page URL for the current query
 * @property {RefObject<HTMLElement | null>} anchorRef - Bar element the dropdown hangs under
 * @property {'bar' | 'hero'} [variant] - `bar` takes its own width, `hero` matches the bar (default `'bar'`)
 * @property {RefObject<HTMLDivElement | null>} [ref] - Ref to the listbox element
 */
interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  activeIndex: number;
  onNavigate: () => void;
  searchHref: string;
  anchorRef: RefObject<HTMLElement | null>;
  variant?: 'bar' | 'hero';
  ref?: RefObject<HTMLDivElement | null>;
}

/**
 * Status line for loading / empty / error states in the dropdown.
 *
 * @param {{ i18nKey: string }} props
 * @returns {JSX.Element}
 */
function StatusLine({ i18nKey }: { i18nKey: string }): JSX.Element {
  const t = useTranslations('search');
  return <p className={styles.dropdownStatus}>{t(i18nKey)}</p>;
}

/**
 * Renders the quick-results dropdown as a body portal anchored under the bar.
 *
 * @param {SearchDropdownProps} props - Component props
 * @param {SearchResult[]} props.results - Search results
 * @param {boolean} props.loading - Whether a search is in flight
 * @param {number} props.activeIndex - Index of the currently highlighted result
 * @param {() => void} props.onNavigate - Callback when a result link is clicked
 * @param {string} props.searchHref - Full-results page URL for the current query
 * @param {RefObject<HTMLElement | null>} props.anchorRef - Bar element the dropdown hangs under
 * @param {'bar' | 'hero'} [props.variant='bar'] - `bar` takes its own width, `hero` matches the bar
 * @param {RefObject<HTMLDivElement | null>} [props.ref] - Ref to the listbox element
 * @returns {JSX.Element | null} The dropdown list, or null without a document
 */
export function SearchDropdown({
  results,
  loading,
  activeIndex,
  onNavigate,
  searchHref,
  anchorRef,
  variant = 'bar',
  ref,
}: SearchDropdownProps): JSX.Element | null {
  const t = useTranslations('search');
  const ownRef = useRef<HTMLDivElement>(null);
  const listRef = ref ?? ownRef;
  const hero = variant === 'hero';

  const { anchorName, cssAnchored } = useAnchorName(anchorRef);
  const maxHeight = useRoomBelow(anchorRef, { min: 160 });

  /* Fallback geometry mirrors the CSS: the hero dropdown matches the bar, the
     bar dropdown keeps its own width and slides back inside the viewport. */
  const compute = useCallback(
    (rect: DOMRect, list: HTMLElement) => {
      const y = rect.bottom + ANCHOR_GAP;
      if (hero) {
        list.style.width = `${rect.width}px`;
        return { x: rect.left, y };
      }
      const maxX = Math.max(
        VIEWPORT_MARGIN,
        window.innerWidth - VIEWPORT_MARGIN - list.offsetWidth,
      );
      return { x: Math.min(Math.max(VIEWPORT_MARGIN, rect.left), maxX), y };
    },
    [hero],
  );

  useAnchoredPosition(anchorRef, listRef, compute, { active: !cssAnchored });

  if (typeof document === 'undefined') return null;

  const style = {
    positionAnchor: anchorName,
    ...(maxHeight !== null && { '--search-dropdown-max': `${maxHeight}px` }),
  } as CSSProperties;

  return createPortal(
    <div
      ref={listRef}
      id='search-dropdown'
      className={cn(styles.dropdown, hero && styles.dropdownHero)}
      role='listbox'
      aria-label={t('ariaLabel')}
      style={style}
      onClick={onNavigate}>
      {loading && results.length === 0 && <StatusLine i18nKey='searching' />}

      {!loading && results.length === 0 && <StatusLine i18nKey='noResults' />}

      {results.slice(0, MAX_DROPDOWN_RESULTS).map((result, index) => (
        <div
          key={result.record.id}
          id={`search-result-${index}`}
          role='option'
          aria-selected={index === activeIndex}
          className={cn(
            styles.dropdownRow,
            index === activeIndex && styles.dropdownRowActive,
          )}
          style={
            {
              animationDelay: `${index * 60}ms`,
            } as React.CSSProperties
          }>
          <SearchResultRow result={result} />
        </div>
      ))}

      <Link href={searchHref} className={styles.digDeeper}>
        <Skeleton></Skeleton>
        <div style={{ paddingBottom: '0.5rem' }}>{t('digDeeper')}</div>
        <Skeleton></Skeleton>
      </Link>
    </div>,
    document.body,
  );
}
