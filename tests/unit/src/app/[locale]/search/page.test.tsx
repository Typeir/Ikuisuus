/**
 * @fileoverview Search Results Page Unit Tests
 * @description Smoke tests for the /{locale}/search page. `useSearch` and
 * `next/navigation` are mocked so no Pagefind bundle or router is needed.
 *
 * @module tests/unit/src/app/[locale]/search/page.test
 */

import SearchPage from '@/app/[locale]/search/page';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navState, searchState } = vi.hoisted(() => ({
  navState: { query: '' },
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
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navState.query),
}));

vi.mock('@/modules/search/application/useSearch', () => ({
  useSearch: () => searchState,
}));

describe('SearchPage', () => {
  beforeEach(() => {
    navState.query = '';
    searchState.results = [];
    searchState.total = 0;
    searchState.loading = false;
    searchState.error = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the no-query state without a query param', () => {
    render(<SearchPage />);
    /* Global next-intl mock renders translation keys verbatim. */
    expect(screen.getByText('noQuery')).toBeTruthy();
  });

  it('should render the result count and rows for a query', () => {
    navState.query = 'q=dragon';
    searchState.total = 1;
    searchState.results = [
      {
        record: {
          id: 'monsters:en:dragon',
          type: 'monsters',
          locale: 'en',
          slug: 'dragon',
          title: 'Ancient Dragon',
          link: '/en/library/monsters/dragon',
          description: 'A test creature.',
          tags: [],
          meta: {},
        },
        score: 1,
        snippet: undefined,
        matchedFields: [],
      },
    ];

    render(<SearchPage />);
    expect(screen.getByText('“dragon”')).toBeTruthy();
    expect(screen.getByText('Ancient Dragon')).toBeTruthy();
  });

  it('should render the error state when search is unavailable', () => {
    navState.query = 'q=dragon';
    searchState.error = new Error('unavailable');

    render(<SearchPage />);
    expect(screen.getByText('unavailable')).toBeTruthy();
  });
});
