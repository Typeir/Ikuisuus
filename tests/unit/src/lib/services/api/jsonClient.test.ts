import {
  getJson,
  HttpStatusError,
  postJson,
} from '@/lib/services/api/jsonClient';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('jsonClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('getJson should return parsed payload on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const result = await getJson<{ ok: boolean }>('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test');
    expect(result).toEqual({ ok: true });
  });

  it('getJson should throw HttpStatusError on non-2xx response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 418,
    });

    await expect(getJson('/api/test')).rejects.toBeInstanceOf(HttpStatusError);
    await expect(getJson('/api/test')).rejects.toMatchObject({ status: 418 });
  });

  it('postJson should send JSON body and return parsed payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const result = await postJson<{ name: string }, { id: number }>(
      '/api/test',
      {
        name: 'entry',
      },
    );

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'entry' }),
    });
    expect(result).toEqual({ id: 1 });
  });

  it('postJson should throw HttpStatusError on non-2xx response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      postJson('/api/test', { name: 'entry' }),
    ).rejects.toMatchObject({
      status: 500,
    });
  });
});
