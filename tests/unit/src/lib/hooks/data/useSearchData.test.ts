import { useLibrarySearchData } from '@/lib/hooks/data/useSearchData';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useSearchData', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('useLibrarySearchData should skip requests for short queries', async () => {
    const { result } = renderHook(() => useLibrarySearchData('a'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('useLibrarySearchData should load results for valid queries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([{ name: 'Goblin', path: 'monsters/goblin' }]),
    });

    const { result } = renderHook(() => useLibrarySearchData('goblin'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([
      { name: 'Goblin', path: 'monsters/goblin' },
    ]);
  });
});
