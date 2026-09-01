/**
 * @fileoverview Tests for useMonsterIndex hook
 * @description Validates lazy loading, fetch behavior, caching, loading states,
 * and error handling for the monster index API hook.
 */

import { useMonsterIndex } from '@/modules/encounter-planner/presentation/importer/useMonsterIndex';
import { fetcher } from '@/lib/fetch/fetcher';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
}));

const mockedFetcher = vi.mocked(fetcher);

/** Sample monster data returned by the API */
const MOCK_MONSTERS = [
  {
    slug: 'goblin',
    title: 'Goblin',
    cr: '1/4',
    size: 'Small',
    creatureType: 'Humanoid',
  },
  {
    slug: 'dragon',
    title: 'Ancient Red Dragon',
    cr: '24',
    size: 'Gargantuan',
    creatureType: 'Dragon',
  },
];

describe('useMonsterIndex', () => {
  beforeEach(() => {
    mockedFetcher.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should start with empty index and not loading', () => {
    const { result } = renderHook(() => useMonsterIndex('en'));

    expect(result.current.index).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch monsters on loadIndex and map entries with id field', async () => {
    mockedFetcher.mockResolvedValue(MOCK_MONSTERS);

    const { result } = renderHook(() => useMonsterIndex('en'));

    await act(async () => {
      await result.current.loadIndex();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.index).toHaveLength(2);
    expect(result.current.index[0]).toEqual(
      expect.objectContaining({ slug: 'goblin', id: 'goblin' }),
    );
  });

  it('should pass locale to the fetch URL', async () => {
    mockedFetcher.mockResolvedValue([]);

    const { result } = renderHook(() => useMonsterIndex('es'));

    await act(async () => {
      await result.current.loadIndex();
    });

    expect(mockedFetcher).toHaveBeenCalledWith('/api/monsters/index?locale=es');
  });

  it('should handle fetch errors gracefully', async () => {
    mockedFetcher.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMonsterIndex('en'));

    await act(async () => {
      await result.current.loadIndex();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.index).toEqual([]);
  });
});
