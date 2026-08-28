/**
 * @fileoverview SearchResultList Tests
 * @description Covers row rendering through the virtual list, the fixed row
 * pitch exposed as a CSS variable, and the tail-triggered batch load.
 * `VirtualList` is mocked to render every row and report the full range.
 *
 * @module tests/unit/src/modules/search/presentation/SearchResultList/SearchResultList
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/modules/search/presentation/SearchResultList/SearchResultList Module under test
 */

import type { VirtualListProps } from '@/lib/components/ui/virtualList/virtualList';
import type { SearchResult } from '@/modules/search/domain';
import {
  LOAD_AHEAD_ROWS,
  RESULT_ROW_REM,
  SearchResultList,
} from '@/modules/search/presentation/SearchResultList/SearchResultList';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { listProps } = vi.hoisted(() => ({
  listProps: { current: null as VirtualListProps<unknown> | null },
}));

vi.mock('@/lib/components/ui/virtualList/virtualList', () => ({
  VirtualList: (props: VirtualListProps<unknown>) => {
    listProps.current = props;
    return (
      <ul>
        {props.items.map((item, index) => (
          <li key={index}>{props.renderRow(item, index)}</li>
        ))}
      </ul>
    );
  },
}));

vi.mock('@/lib/hooks/useRootPx', () => ({
  useRootPx: () => 16,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/search',
}));

/**
 * Builds a minimal result with the given index baked into its identity.
 *
 * @param {number} index - Ordinal used for id, slug and title
 * @returns {SearchResult} A typed result
 */
function makeResult(index: number): SearchResult {
  return {
    record: {
      id: `monsters:en:m${index}`,
      type: 'monsters',
      locale: 'en',
      slug: `m${index}`,
      title: `Monster ${index}`,
      link: `/en/library/monsters/m${index}`,
      description: 'A test creature.',
      tags: [],
      meta: {},
    },
    score: 1,
    snippet: undefined,
    matchedFields: [],
  } as unknown as SearchResult;
}

describe('SearchResultList', () => {
  afterEach(() => {
    cleanup();
    listProps.current = null;
  });

  it('should render every result as a row', () => {
    const results = [makeResult(1), makeResult(2)];
    render(
      <SearchResultList results={results} hasMore={false} loadMore={vi.fn()} />,
    );
    expect(screen.getByText('Monster 1')).toBeTruthy();
    expect(screen.getByText('Monster 2')).toBeTruthy();
  });

  it('should expose the row height from the root px and pass a larger pitch', () => {
    render(
      <SearchResultList
        results={[makeResult(1)]}
        hasMore={false}
        loadMore={vi.fn()}
      />,
    );
    const wrap = screen.getByTestId('search-result-list');
    expect(wrap.style.getPropertyValue('--search-row-height')).toBe(
      `${16 * RESULT_ROW_REM}px`,
    );
    expect(listProps.current?.rowHeight).toBeGreaterThan(16 * RESULT_ROW_REM);
  });

  it('should load more when the rendered range reaches the tail', () => {
    const loadMore = vi.fn();
    const results = Array.from({ length: 20 }, (_, i) => makeResult(i));
    render(
      <SearchResultList results={results} hasMore loadMore={loadMore} />,
    );
    const range = { startIndex: 0, stopIndex: 19 - LOAD_AHEAD_ROWS };
    listProps.current?.onRowsRendered?.(range, range);
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('should not load more before the tail or when nothing remains', () => {
    const loadMore = vi.fn();
    const results = Array.from({ length: 20 }, (_, i) => makeResult(i));
    const { unmount } = render(
      <SearchResultList results={results} hasMore loadMore={loadMore} />,
    );
    const early = { startIndex: 0, stopIndex: 5 };
    listProps.current?.onRowsRendered?.(early, early);
    expect(loadMore).not.toHaveBeenCalled();
    unmount();

    render(
      <SearchResultList results={results} hasMore={false} loadMore={loadMore} />,
    );
    const tail = { startIndex: 10, stopIndex: 19 };
    listProps.current?.onRowsRendered?.(tail, tail);
    expect(loadMore).not.toHaveBeenCalled();
  });
});
