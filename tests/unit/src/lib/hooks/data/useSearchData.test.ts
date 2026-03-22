import {
  useExternalSearchData,
  useLibrarySearchData,
} from '@/lib/hooks/data/useSearchData';
import { act, renderHook, waitFor } from '@testing-library/react';
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

  it('useExternalSearchData should debounce requests by 300ms', async () => {
    vi.useFakeTimers();

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ title: 'Result', link: 'https://test' }]),
    });

    const { result } = renderHook(() => useExternalSearchData('result'));

    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.results).toEqual([
      { title: 'Result', link: 'https://test' },
    ]);
  });

  it('useExternalSearchData should keep only latest request results', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    let resolveSecond: ((value: unknown) => void) | undefined;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    mockFetch
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result, rerender } = renderHook(
      ({ query }) => useExternalSearchData(query),
      { initialProps: { query: 'first' } },
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 310));
    });

    rerender({ query: 'second' });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 310));
      resolveSecond?.({
        ok: true,
        json: () =>
          Promise.resolve([{ title: 'Second', link: 'https://second' }]),
      });
    });

    await waitFor(() => {
      expect(result.current.results).toEqual([
        { title: 'Second', link: 'https://second' },
      ]);
    });

    await act(async () => {
      resolveFirst?.({
        ok: true,
        json: () =>
          Promise.resolve([{ title: 'First', link: 'https://first' }]),
      });
    });

    expect(result.current.results).toEqual([
      { title: 'Second', link: 'https://second' },
    ]);
  });
});
