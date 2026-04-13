/**
 * @fileoverview Unit Tests — corrections tree API route
 * @description Validates the GET handler that returns the content directory tree
 * for a given locale.
 *
 * @module tests/unit/src/app/api/corrections/tree/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockListContentTree = vi.fn();

vi.mock('@/lib/db/content/contentTreeService', () => ({
  listContentTree: (...args: unknown[]) => mockListContentTree(...args),
}));

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      message: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import { GET } from '@/app/api/corrections/tree/route';
import { NextRequest } from 'next/server';

/**
 * Creates a NextRequest for the corrections tree endpoint.
 *
 * @param {string} locale - Locale query param
 * @returns {NextRequest} Mock request
 */
function makeRequest(locale?: string): NextRequest {
  const url = locale
    ? `http://localhost/api/corrections/tree?locale=${locale}`
    : 'http://localhost/api/corrections/tree';
  return new NextRequest(url);
}

describe('GET /api/corrections/tree', () => {
  beforeEach(() => {
    mockListContentTree.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the tree for the requested locale', async () => {
    const tree = [{ name: 'monsters', path: 'en/monsters', children: [] }];
    mockListContentTree.mockResolvedValue(tree);

    const res = await GET(makeRequest('en'));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tree).toEqual(tree);
    expect(mockListContentTree).toHaveBeenCalledWith('en');
  });

  it('defaults to locale en when no locale param is provided', async () => {
    mockListContentTree.mockResolvedValue([]);

    await GET(makeRequest());

    expect(mockListContentTree).toHaveBeenCalledWith('en');
  });

  it('passes the provided locale to listContentTree', async () => {
    mockListContentTree.mockResolvedValue([]);

    await GET(makeRequest('es'));

    expect(mockListContentTree).toHaveBeenCalledWith('es');
  });

  it('returns an empty tree array when the content root has no entries', async () => {
    mockListContentTree.mockResolvedValue([]);

    const res = await GET(makeRequest('fi'));

    const json = await res.json();
    expect(json.tree).toEqual([]);
  });

  it('returns 500 when listContentTree throws an error', async () => {
    mockListContentTree.mockRejectedValue(new Error('Adapter failure'));

    const res = await GET(makeRequest('en'));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Failed to fetch content tree');
  });
});
