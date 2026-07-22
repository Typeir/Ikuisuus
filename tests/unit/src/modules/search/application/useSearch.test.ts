/**
 * @fileoverview useSearch Hook Unit Tests
 * @description Covers idle/short-query state, a successful search with a
 * mocked Pagefind client, and the unavailable-bundle error path.
 *
 * @module tests/unit/src/modules/search/application/useSearch
 */

import { toSearchQuery, useSearch } from '@/modules/search/application/useSearch';
import { renderHook, waitFor } from '@testing-library/react';
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
    expect(searchPagefindMock).toHaveBeenCalledWith('en', 'dragon');
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
