/**
 * @fileoverview Tests for the SWR global fetcher.
 * @description Verifies `fetcher` returns parsed JSON on success, throws
 * `FetchError` with correct fields on non-OK responses, and handles both
 * JSON-body and plain-text error bodies.
 *
 * @module tests/unit/src/lib/fetch/fetcher.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { FetchError, fetcher } from '@/lib/fetch/fetcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetcher', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on a 200 response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'goblin' }),
    });

    const result = await fetcher<{ slug: string }>('/api/monsters/goblin');
    expect(result).toEqual({ slug: 'goblin' });
    expect(mockFetch).toHaveBeenCalledWith('/api/monsters/goblin', undefined);
  });

  it('throws FetchError with JSON body on a non-OK response', async () => {
    const errorBody = { message: 'Not found' };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      clone: () => ({
        json: () => Promise.resolve(errorBody),
      }),
      text: () => Promise.resolve(''),
    });

    await expect(fetcher('/api/monsters/missing')).rejects.toMatchObject({
      status: 404,
      statusText: 'Not Found',
      url: '/api/monsters/missing',
    });
  });

  it('throws FetchError with text body when JSON parse fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      clone: () => ({
        json: () => Promise.reject(new SyntaxError('bad json')),
      }),
      text: () => Promise.resolve('Internal Server Error'),
    });

    let caught: FetchError | undefined;
    try {
      await fetcher('/api/broken');
    } catch (err) {
      caught = err as FetchError;
    }
    expect(caught).toBeInstanceOf(FetchError);
    expect(caught?.body).toBe('Internal Server Error');
    expect(caught?.status).toBe(500);
  });

  it('throws a FetchError (not a generic Error) so hooks can distinguish', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      clone: () => ({ json: () => Promise.resolve({}) }),
      text: () => Promise.resolve(''),
    });

    await expect(fetcher('/api/auth/me')).rejects.toBeInstanceOf(FetchError);
  });

  it('accepts a tuple [url, init] and passes init to fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetcher<unknown[]>(['/api/search', { cache: 'no-store' }]);
    expect(mockFetch).toHaveBeenCalledWith('/api/search', {
      cache: 'no-store',
    });
  });
});
