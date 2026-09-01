/**
 * @fileoverview Tests for fetchStubChildren pure function
 * @module tests/unit/src/modules/navigation-sidebar/application/api-clients/fetchStubChildren.test
 */

import { fetchStubChildren } from '@/modules/navigation-sidebar/application/api-clients/fetchStubChildren';
import { fetcher } from '@/lib/fetch/fetcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/fetch/fetcher', () => ({
  fetcher: vi.fn(),
  FetchError: class FetchError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    url: string;

    constructor(status: number, statusText: string, body: unknown, url: string) {
      super(`HTTP ${status} ${statusText}`);
      this.name = 'FetchError';
      this.status = status;
      this.statusText = statusText;
      this.body = body;
      this.url = url;
    }
  },
}));

const mockFetcher = vi.mocked(fetcher);

describe('fetchStubChildren', () => {
  beforeEach(() => {
    mockFetcher.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch children from API endpoint with correct parameters', async () => {
    mockFetcher.mockResolvedValueOnce([{ name: 'child1', path: '/child1' }] as never);

    await fetchStubChildren('test-path', 'en');

    expect(mockFetcher).toHaveBeenCalledWith(
      expect.stringContaining('/api/content/walk'),
    );
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.stringContaining('locale=en'),
    );
    expect(mockFetcher).toHaveBeenCalledWith(
      expect.stringContaining('path=test-path'),
    );
  });

  it('should return parsed JSON array on successful fetch', async () => {
    const mockData = [
      { name: 'child1', path: '/child1' },
      { name: 'child2', path: '/child2' },
    ];
    mockFetcher.mockResolvedValueOnce(mockData as never);

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual(mockData);
  });

  it('should return empty array on fetch error', async () => {
    mockFetcher.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should return empty array on a non-2xx response instead of its error body', async () => {
    const { FetchError } = await import('@/lib/fetch/fetcher');
    mockFetcher.mockRejectedValueOnce(
      new FetchError(500, 'Internal Server Error', { error: 'walk failed' }, '/api/content/walk'),
    );

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should return empty array when a 2xx body is not an array', async () => {
    mockFetcher.mockResolvedValueOnce({ error: 'unexpected shape' } as never);

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should URL-encode path and locale parameters', async () => {
    mockFetcher.mockResolvedValueOnce([] as never);

    await fetchStubChildren('path/with spaces', 'en-US');

    const callUrl = mockFetcher.mock.calls[0][0] as string;
    expect(callUrl).toContain('locale=en-US');
    expect(callUrl).toContain('path=path%2Fwith%20spaces');
  });
});
