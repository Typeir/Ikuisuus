/**
 * @fileoverview Virtualized search result list.
 * @description Renders `SearchResultRow`s through the shared `VirtualList` at
 * a fixed rem pitch, so a broad query mounts a screenful of rows instead of
 * every resolved hit. Resolves the next Pagefind batch as the rendered range
 * nears the tail. Fills the viewport below its mount point and scrolls inside
 * that box.
 *
 * @module modules/search/presentation/SearchResultList/SearchResultList
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import {
  VirtualList,
  type VirtualRowRange,
} from '@/lib/components/ui/virtualList/virtualList';
import { useRootPx } from '@/lib/hooks/useRootPx';
import type { JSX, RefObject } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { SearchResult } from '../../domain';
import { SearchResultRow } from '../SearchResultRow/SearchResultRow';
import styles from './SearchResultList.module.scss';

/**
 * Row height in rem: two title lines, two snippet lines, type label and meta
 * trail, plus the row padding.
 *
 * @constant
 * @type {number}
 */
export const RESULT_ROW_REM = 9;

/**
 * Vertical gap between rows in rem, carried by the pitch since virtualized
 * rows are absolutely positioned.
 *
 * @constant
 * @type {number}
 */
export const RESULT_ROW_GAP_REM = 0.25;

/**
 * Rows before the tail at which the next batch starts resolving.
 *
 * @constant
 * @type {number}
 */
export const LOAD_AHEAD_ROWS = 6;

/** Rows kept mounted past the visible edge on either side. */
const OVERSCAN_ROWS = 4;

/** Smallest list height; short viewports still get a usable scroll box. */
const MIN_LIST_HEIGHT = 240;

/** Breathing room kept under the list. */
const BOTTOM_MARGIN = 16;

/**
 * Props for `SearchResultList`.
 *
 * @interface SearchResultListProps
 * @property {SearchResult[]} results - Resolved results so far
 * @property {boolean} hasMore - Whether unresolved hits remain
 * @property {() => void} loadMore - Resolves the next batch
 */
export interface SearchResultListProps {
  results: SearchResult[];
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Viewport room below the element's top edge, re-measured on resize.
 *
 * @param {RefObject<HTMLElement | null>} ref - Element whose top bounds the list
 * @returns {number} Pixel height available below the element's top edge
 */
function useRoomBelow(ref: RefObject<HTMLElement | null>): number {
  const [room, setRoom] = useState(MIN_LIST_HEIGHT);
  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const { top } = node.getBoundingClientRect();
    setRoom(
      Math.max(MIN_LIST_HEIGHT, window.innerHeight - top - BOTTOM_MARGIN),
    );
  }, [ref]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return room;
}

/**
 * Virtualized list of search results that pulls the next batch near its tail.
 *
 * @param {SearchResultListProps} props - Component props
 * @param {SearchResult[]} props.results - Resolved results so far
 * @param {boolean} props.hasMore - Whether unresolved hits remain
 * @param {() => void} props.loadMore - Resolves the next batch
 * @returns {JSX.Element} The result list
 */
export function SearchResultList({
  results,
  hasMore,
  loadMore,
}: SearchResultListProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rootPx = useRootPx();
  const rowHeight = Math.round(rootPx * RESULT_ROW_REM);
  const pitch = Math.round(rootPx * (RESULT_ROW_REM + RESULT_ROW_GAP_REM));
  const maxHeight = useRoomBelow(wrapRef);

  const handleRowsRendered = useCallback(
    (visible: VirtualRowRange) => {
      if (
        hasMore &&
        visible.stopIndex >= results.length - 1 - LOAD_AHEAD_ROWS
      ) {
        loadMore();
      }
    },
    [hasMore, loadMore, results.length],
  );

  const renderRow = useCallback(
    (result: SearchResult) => <SearchResultRow result={result} />,
    [],
  );

  return (
    <div
      ref={wrapRef}
      className='not-prose'
      data-testid='search-result-list'
      style={
        { '--search-row-height': `${rowHeight}px` } as React.CSSProperties
      }>
      <VirtualList
        items={results}
        rowHeight={pitch}
        maxHeight={maxHeight}
        overscanCount={OVERSCAN_ROWS}
        renderRow={renderRow}
        onRowsRendered={handleRowsRendered}
        className={styles.list}
      />
    </div>
  );
}
