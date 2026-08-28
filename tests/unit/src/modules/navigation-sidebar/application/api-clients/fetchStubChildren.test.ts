/**
 * @fileoverview Tests for fetchStubChildren pure function
 * @module tests/unit/src/modules/navigation-sidebar/application/api-clients/fetchStubChildren
 */

import { fetchStubChildren } from '@/modules/navigation-sidebar/application/api-clients/fetchStubChildren';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchStubChildren', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch children from API endpoint with correct parameters', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ name: 'child1', path: '/child1' }],
    } as Response);

    await fetchStubChildren('test-path', 'en');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/content/walk'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('locale=en'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('path=test-path'),
    );
  });

  it('should return parsed JSON array on successful fetch', async () => {
    const mockFetch = vi.mocked(global.fetch);
    const mockData = [
      { name: 'child1', path: '/child1' },
      { name: 'child2', path: '/child2' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual(mockData);
  });

  it('should return empty array on fetch error', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should return empty array on a non-2xx response instead of its error body', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'walk failed' }),
    } as Response);

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should return empty array when a 2xx body is not an array', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'unexpected shape' }),
    } as Response);

    const result = await fetchStubChildren('test-path', 'en');

    expect(result).toEqual([]);
  });

  it('should URL-encode path and locale parameters', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await fetchStubChildren('path/with spaces', 'en-US');

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain('locale=en-US');
    expect(callUrl).toContain('path=path%2Fwith%20spaces');
  });
});
