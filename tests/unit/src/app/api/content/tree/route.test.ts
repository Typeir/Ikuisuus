/**
 * @fileoverview Unit tests for the content file-tree API route
 * @description Ensures the GET handler properly forwards params to
 * `listDirectory` and handles success/error responses.
 *
 * @module tests/unit/src/app/api/content/tree/route
 */

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockListDirectory = vi.fn();

vi.mock('@/lib/db/content', () => ({
  listDirectory: (...args: unknown[]) => mockListDirectory(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { GET } from '@/app/api/content/tree/route';

function makeRequest(query = ''): NextRequest {
  const url = `http://localhost/api/content/tree${query ? `?${query}` : ''}`;
  return new NextRequest(url);
}

describe('GET /api/content/tree (unit)', () => {
  beforeEach(() => {
    mockListDirectory.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns entries for a locale', async () => {
    mockListDirectory.mockResolvedValue({
      entries: [{ name: 'items', isDirectory: true }],
      total: 1,
    });

    const res = await GET(makeRequest('locale=en'));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entries).toBeDefined();
    expect(json.total).toBe(1);
    expect(mockListDirectory).toHaveBeenCalledWith(
      'en',
      '',
      expect.any(Object),
    );
  });

  it('forwards paging and filter params', async () => {
    mockListDirectory.mockResolvedValue({ entries: [], total: 0 });

    const res = await GET(
      makeRequest('locale=es&path=items&limit=2&filter=foo&sort=name'),
    );

    expect(res.status).toBe(200);
    expect(mockListDirectory).toHaveBeenCalledWith(
      'es',
      'items',
      expect.objectContaining({ limit: 2, filter: 'foo', sort: 'name' }),
    );
  });

  it('returns 500 when adapter fails', async () => {
    mockListDirectory.mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest('locale=en'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });
});
