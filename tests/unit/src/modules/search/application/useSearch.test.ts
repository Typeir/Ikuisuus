/**
 * @fileoverview useSearch Hook Unit Tests
 * @description Covers idle/short-query state, a successful search with a
 * mocked Pagefind client, and the unavailable-bundle error path.
 *
 * @module tests/unit/src/modules/search/application/useSearch
 */

import { toSearchQuery, useSearch } from '@/modules/search/application/useSearch';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchPagefindMock, mapPagefindResultMock } = vi.hoisted(() => ({
  searchPagefindMock: vi.fn(),
  mapPagefindResultMock: vi.fn(),
}));

vi.mock('@/modules/search/infrastructure/pagefindClient', () => ({
  searchPagefind: searchPagefindMock,
}));

vi.mock('@/modules/search/infrastructure/mapRecord', () => ({
  mapPagefindResult: mapPagefindResultMock,
}));

describe('useSearch', () => {
  beforeEach(() => {
    searchPagefindMock.mockReset();
    mapPagefindResultMock.mockReset();
  });

  it('should return empty results for queries below the minimum length', async () => {
    const { result } = renderHook(() => useSearch('d', 'en', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(searchPagefindMock).not.toHaveBeenCalled();
  });

  it('should map and return results for a valid query', async () => {
    const mapped = { record: { id: 'monsters:en:dragon' } };
    searchPagefindMock.mockResolvedValue({
      results: [{ data: async () => ({ url: '/en/library/monsters/dragon' }) }],
    });
    mapPagefindResultMock.mockReturnValue(mapped);

    const { result } = renderHook(() => useSearch('dragon', 'en', 0));

    await waitFor(() => expect(result.current.total).toBe(1));
    expect(result.current.results[0]).toBe(mapped);
    expect(result.current.error).toBeNull();
    expect(searchPagefindMock).toHaveBeenCalledWith('en', 'dragon', undefined);
  });

  it('should pass aspect filters through to the search', async () => {
    searchPagefindMock.mockResolvedValue({ results: [] });

    renderHook(() =>
      useSearch('', 'en', 0, { damage: ['fire'] }),
    );

    await waitFor(() =>
      expect(searchPagefindMock).toHaveBeenCalledWith('en', '', {
        filters: { damage: ['fire'] },
      }),
    );
  });

  /** Filters bypass the minimum term length check. */
  it('should search on filters alone with no term', async () => {
    searchPagefindMock.mockResolvedValue({ results: [] });

    renderHook(() => useSearch('', 'en', 0, { save: ['dex'] }));

    await waitFor(() => expect(searchPagefindMock).toHaveBeenCalled());
  });

  it('should not search when there is neither a term nor a filter', async () => {
    searchPagefindMock.mockClear();

    renderHook(() => useSearch('', 'en', 0, {}));

    await waitFor(() => expect(searchPagefindMock).not.toHaveBeenCalled());
  });

  /** A broad query must not resolve a fragment per hit up front. */
  it('should resolve only the first batch and report the full total', async () => {
    const hits = Array.from({ length: 45 }, (_, i) => ({
      data: vi.fn(async () => ({ url: `/en/library/page-${i}` })),
    }));
    searchPagefindMock.mockResolvedValue({ results: hits });
    mapPagefindResultMock.mockImplementation((fragment: { url: string }) => ({
      record: { id: fragment.url },
    }));

    const { result } = renderHook(() => useSearch('as', 'en', 0));

    await waitFor(() => expect(result.current.total).toBe(45));
    expect(result.current.results).toHaveLength(20);
    expect(result.current.hasMore).toBe(true);
    expect(hits.filter((hit) => hit.data.mock.calls.length > 0)).toHaveLength(
      20,
    );

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.results).toHaveLength(40));
    expect(hits[39]?.data).toHaveBeenCalled();
    expect(hits[40]?.data).not.toHaveBeenCalled();

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.results).toHaveLength(45));
    expect(result.current.hasMore).toBe(false);
  });

  it('should honour an explicit page size', async () => {
    const hits = Array.from({ length: 30 }, (_, i) => ({
      data: vi.fn(async () => ({ url: `/en/library/page-${i}` })),
    }));
    searchPagefindMock.mockResolvedValue({ results: hits });
    mapPagefindResultMock.mockImplementation((fragment: { url: string }) => ({
      record: { id: fragment.url },
    }));

    const { result } = renderHook(() =>
      useSearch('as', 'en', 0, undefined, 7),
    );

    await waitFor(() => expect(result.current.results).toHaveLength(7));
    expect(result.current.total).toBe(30);
  });

  it('should set an error when the search bundle is unavailable', async () => {
    searchPagefindMock.mockResolvedValue(null);
    const { result } = renderHook(() => useSearch('dragon', 'en', 0));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.results).toEqual([]);
  });
});

describe('toSearchQuery', () => {
  it('should build a typed query object', () => {
    expect(toSearchQuery('dragon', 'en')).toEqual({
      term: 'dragon',
      locale: 'en',
    });
  });
});
