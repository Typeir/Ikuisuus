/**
 * Integration tests for GET /api/content/tree.
 *
 * Asserts the route forwards query params to `listDirectory` and returns
 * the expected JSON shape. Runs against a mocked `listDirectory`.
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

beforeEach(() => {
  mockListDirectory.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/content/tree', () => {
  it('returns directory entries with default locale', async () => {
    mockListDirectory.mockResolvedValue({
      entries: [{ name: 'monsters', isDirectory: true }],
      total: 1,
      nextCursor: undefined,
    });

    const { GET } = await import('@/app/api/content/tree/route');
    const req = new NextRequest('http://localhost:3000/api/content/tree');
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('entries');
    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.total).toBe(1);
  });

  it('forwards query params to listDirectory', async () => {
    mockListDirectory.mockResolvedValue({ entries: [], total: 0 });

    const { GET } = await import('@/app/api/content/tree/route');
    const req = new NextRequest(
      'http://localhost:3000/api/content/tree?locale=es&path=items&limit=2&filter=foo&sort=name',
    );
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    expect(mockListDirectory).toHaveBeenCalledWith(
      'es',
      'items',
      expect.objectContaining({ limit: 2, filter: 'foo', sort: 'name' }),
    );
  });

  it('returns 500 on adapter error', async () => {
    mockListDirectory.mockRejectedValue(new Error('boom'));

    const { GET } = await import('@/app/api/content/tree/route');
    const req = new NextRequest(
      'http://localhost:3000/api/content/tree?locale=en',
    );
    const res = await GET(req as any);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});
