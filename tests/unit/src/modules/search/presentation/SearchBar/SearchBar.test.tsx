/**
 * @fileoverview SearchBar Unit Tests
 * @description Tests input wiring, dropdown open/close rules, arrow/Enter/
 * Escape keyboard navigation, form submit, Cmd/Ctrl-K shortcut, and
 * outside-click dismissal. `useSearch` is mocked.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/SearchBar
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, searchState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchState: {
    results: [] as unknown[],
    total: 0,
    loading: false,
    error: null as Error | null,
    debouncing: false,
  },
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/modules/search/application/useSearch', () => ({
  useSearch: () => searchState,
  toSearchQuery: vi.fn(),
}));

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

describe('SearchBar', () => {
  beforeEach(() => {
    pushMock.mockReset();
    searchState.results = [];
    searchState.total = 0;
    searchState.loading = false;
    searchState.error = null;
    searchState.debouncing = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('should render a combobox input with the shortcut hint', () => {
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    expect(input).toBeTruthy();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Ctrl+K')).toBeTruthy();
  });

  it('should open the dropdown when typing at least two characters', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dr' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByText('Ancient Dragon')).toBeTruthy();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('should not open the dropdown for a single character', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'd' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should keep the dropdown hidden while debouncing', () => {
    searchState.debouncing = true;
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dr' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should cycle the active result with arrow keys', () => {
    searchState.results = [
      mkResult('dragon', 'Ancient Dragon'),
      mkResult('wyvern', 'Wyvern'),
    ];
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dr' } });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('search-result-0');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('search-result-1');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe('search-result-0');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.getAttribute('aria-activedescendant')).toBe('search-result-1');
  });

  it('should navigate to the active result on Enter and clear the query', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    render(<SearchBar />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'dr' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('/en/library/monsters/dragon');
    expect(input.value).toBe('');
  });

  it('should push to the full search page on form submit', () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dragon' },
    });
    fireEvent.submit(screen.getByRole('search'));
    expect(pushMock).toHaveBeenCalledWith('/en/search?q=dragon');
  });

  it('should not submit queries shorter than two characters', () => {
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'd' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('should close the dropdown on Escape', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dr' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should close the dropdown on outside mousedown', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    render(<SearchBar />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dr' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('should focus the input on Ctrl+K', () => {
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('should call onNavigate and clear the query when a result is clicked', () => {
    searchState.results = [mkResult('dragon', 'Ancient Dragon')];
    const onNavigate = vi.fn();
    render(<SearchBar onNavigate={onNavigate} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'dr' } });
    fireEvent.click(screen.getByRole('listbox'));
    expect(onNavigate).toHaveBeenCalled();
    expect(input.value).toBe('');
  });
});
