/**
 * @fileoverview useSearchFacets Hook Unit Tests
 * @module tests/unit/src/modules/search/application/useSearchFacets
 */

import { useSearchFacets } from '@/modules/search/application/useSearchFacets';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getFiltersMock } = vi.hoisted(() => ({
  getFiltersMock: vi.fn(),
}));

vi.mock('@/modules/search/infrastructure/pagefindClient', () => ({
  getFilters: getFiltersMock,
}));

describe('useSearchFacets', () => {
  beforeEach(() => {
    getFiltersMock.mockReset();
  });

  it('should map raw filters into sorted facet values', async () => {
    getFiltersMock.mockResolvedValue({
      type: { monsters: 3, spells: 7 },
    });

    const { result } = renderHook(() => useSearchFacets('en'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.facets).toEqual([
      {
        field: 'type',
        label: 'type',
        values: [
          { value: 'spells', count: 7 },
          { value: 'monsters', count: 3 },
        ],
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('should return empty facets when the bundle is unavailable', async () => {
    getFiltersMock.mockResolvedValue(null);
    const { result } = renderHook(() => useSearchFacets('en'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.facets).toEqual([]);
  });
});
