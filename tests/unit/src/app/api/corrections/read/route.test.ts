/**
 * Corrections Read API Route Unit Tests
 *
 * @fileoverview Tests for GET /api/corrections/read.
 *
 * @module tests/unit/app/api/corrections/read/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindActiveDraft = vi.fn();

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));
vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: {
    findActive: (...args: unknown[]) => mockFindActiveDraft(...args),
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env.CONTENT_REPO_OWNER = 'owner';
  process.env.CONTENT_REPO_NAME = 'repo';
  process.env.GITHUB_PAT = 'token';
  mockFindActiveDraft.mockResolvedValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

/**
 * Builds a fake NextRequest with URL search params.
 *
 * @param {Record<string, string>} params - Query parameters
 * @returns {object} NextRequest-like object
 */
const makeReq = (params: Record<string, string>) => {
  const url = new URL('http://localhost/api/corrections/read');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return { url: url.toString() } as any;
};

describe('GET /api/corrections/read', () => {
  it('should return 400 if slug is missing', async () => {
    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('should return content when file is found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: 'file',
        content: Buffer.from('# Hello').toString('base64'),
        sha: 'abc123',
        path: 'en/monsters/aboleth.mdx',
      }),
    });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'monsters/aboleth' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.content).toBe('# Hello');
    expect(json.sha).toBe('abc123');
    expect(json.draftCursor).toEqual({ updatedAt: null, versionHash: null });
  });

  it('should try path variants and return 404 when none match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 404,
      json: async () => ({}),
    });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'nonexistent' }));

    expect(res.status).toBe(404);
  });

  it('should return 502 on GitHub API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'monsters/aboleth' }));
    expect(res.status).toBe(502);
  });

  it('should use locale parameter for path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        type: 'file',
        content: Buffer.from('# Hola').toString('base64'),
        sha: 'xyz',
        path: 'es/monsters/aboleth.mdx',
      }),
    });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'monsters/aboleth', locale: 'es' }));
    const json = await res.json();
    expect(json.content).toBe('# Hola');
  });
});
