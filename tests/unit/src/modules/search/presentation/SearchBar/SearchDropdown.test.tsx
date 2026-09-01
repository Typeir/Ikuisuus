/**
 * @fileoverview SearchDropdown Unit Tests
 * @module tests/unit/src/modules/search/presentation/SearchBar/SearchDropdown.test
 */

import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import {
  MAX_DROPDOWN_RESULTS,
  SearchDropdown,
} from '@/modules/search/presentation/SearchBar/SearchDropdown';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('SearchDropdown', () => {
  it('should render results as listbox options with the active row selected', () => {
    render(
      <SearchDropdown
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
});
