/**
 * @fileoverview SearchDropdown Unit Tests
 * @module tests/unit/src/modules/search/presentation/SearchBar/SearchDropdown.test
 */

import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import {
  MAX_DROPDOWN_RESULTS,
  SearchDropdown,
} from '@/modules/search/presentation/SearchBar/SearchDropdown';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Build a minimal SearchResult for dropdown rendering.
 *
 * @param {string} slug - Record slug (also used for the id and link)
 * @param {string} title - Result title
 * @returns {SearchResult} A populated search result
 */
function mkResult(slug: string, title: string): SearchResult {
  return {
    record: {
      id: `monsters:en:${slug}`,
      type: 'monsters' as SearchContentType,
      locale: 'en',
      slug,
      title,
      link: `/en/library/monsters/${slug}`,
      description: 'A test creature.',
      tags: [],
      meta: {},
    },
    score: 1,
    snippet: undefined,
    matchedFields: [],
  };
}

/**
 * Mount a bar element in the body with a fixed rect for the dropdown to hang under.
 *
 * @param {number} left - Bar left edge in px
 * @param {number} width - Bar width in px
 * @returns {RefObject<HTMLElement | null>} Ref to the mounted bar
 */
function mkAnchor(left = 50, width = 100): RefObject<HTMLElement | null> {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  anchor.getBoundingClientRect = () =>
    ({ top: 100, bottom: 120, left, right: left + width, width, height: 20 }) as DOMRect;
  return { current: anchor };
}

describe('SearchDropdown', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('should render results as listbox options with the active row selected', () => {
    render(
      <SearchDropdown
        anchorRef={mkAnchor()}
        results={[mkResult('dragon', 'Ancient Dragon'), mkResult('wyvern', 'Wyvern')]}
        loading={false}
        activeIndex={1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dragon'
      />,
    );
    expect(screen.getByRole('listbox')).toBeTruthy();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Ancient Dragon')).toBeTruthy();
  });

  it('should cap the rendered rows at MAX_DROPDOWN_RESULTS', () => {
    const results = Array.from({ length: MAX_DROPDOWN_RESULTS + 3 }, (_, i) =>
      mkResult(`r${i}`, `Result ${i}`),
    );
    render(
      <SearchDropdown
        anchorRef={mkAnchor()}
        results={results}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=r'
      />,
    );
    expect(screen.getAllByRole('option')).toHaveLength(MAX_DROPDOWN_RESULTS);
  });

  it('should show the searching status while loading with no results', () => {
    render(
      <SearchDropdown
        anchorRef={mkAnchor()}
        results={[]}
        loading={true}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dr'
      />,
    );
    expect(screen.getByText('searching')).toBeTruthy();
  });

  it('should show the empty status when idle with no results', () => {
    render(
      <SearchDropdown
        anchorRef={mkAnchor()}
        results={[]}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dr'
      />,
    );
    expect(screen.getByText('noResults')).toBeTruthy();
  });

  it('should call onNavigate on click and link to the full search page', () => {
    const onNavigate = vi.fn();
    render(
      <SearchDropdown
        anchorRef={mkAnchor()}
        results={[mkResult('dragon', 'Ancient Dragon')]}
        loading={false}
        activeIndex={-1}
        onNavigate={onNavigate}
        searchHref='/en/search?q=dragon'
      />,
    );
    fireEvent.click(screen.getByRole('listbox'));
    expect(onNavigate).toHaveBeenCalled();
    expect(screen.getByText('digDeeper').closest('a')?.getAttribute('href')).toBe(
      '/en/search?q=dragon',
    );
  });

  it('should portal the listbox to the body and expose it through ref', () => {
    const ref: RefObject<HTMLDivElement | null> = { current: null };
    const { container } = render(
      <SearchDropdown
        ref={ref}
        anchorRef={mkAnchor()}
        results={[mkResult('dragon', 'Ancient Dragon')]}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dragon'
      />,
    );
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(ref.current).toBe(document.body.querySelector('#search-dropdown'));
  });

  it('should hang the bar dropdown under the bar left edge with its own width', () => {
    render(
      <SearchDropdown
        anchorRef={mkAnchor(50, 100)}
        results={[]}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dr'
      />,
    );
    const listbox = screen.getByRole('listbox') as HTMLElement;
    expect(listbox.style.transform).toBe('translate3d(50px, 124px, 0)');
    expect(listbox.style.width).toBe('');
  });

  it('should keep the bar dropdown clear of the viewport left margin', () => {
    render(
      <SearchDropdown
        anchorRef={mkAnchor(4, 100)}
        results={[]}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dr'
      />,
    );
    const listbox = screen.getByRole('listbox') as HTMLElement;
    expect(listbox.style.transform).toBe('translate3d(16px, 124px, 0)');
  });

  it('should size the hero dropdown to the bar', () => {
    render(
      <SearchDropdown
        variant='hero'
        anchorRef={mkAnchor(4, 480)}
        results={[]}
        loading={false}
        activeIndex={-1}
        onNavigate={vi.fn()}
        searchHref='/en/search?q=dr'
      />,
    );
    const listbox = screen.getByRole('listbox') as HTMLElement;
    expect(listbox.style.width).toBe('480px');
    expect(listbox.style.transform).toBe('translate3d(4px, 124px, 0)');
  });
});
