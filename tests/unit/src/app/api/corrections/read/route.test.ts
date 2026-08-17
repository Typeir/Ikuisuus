/**
 * Corrections Read API Route Unit Tests
 *
 * @fileoverview Tests for GET /api/corrections/read.
 *
 * @module tests/unit/app/api/corrections/read/route
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindActiveDraft = vi.fn();

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));
const fsFetch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/content/adapters/fs/fsContentSource', () => ({
  fsContentSource: { fetch: (...a: unknown[]) => fsFetch(...a) },
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

  it('should resolve .heirloom path variant for unsuffixed slug', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 404, ok: false, text: async () => '' })
      .mockResolvedValueOnce({ status: 404, ok: false, text: async () => '' })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          type: 'file',
          content: Buffer.from('# Heirloom').toString('base64'),
          sha: 'h1',
          path: 'en/items/heirlooms/sunblade.heirloom.mdx',
        }),
      });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'items/heirlooms/sunblade' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.path).toBe('en/items/heirlooms/sunblade.heirloom.mdx');
  });

  it('should resolve .trinket path variant for unsuffixed slug', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 404, ok: false, text: async () => '' })
      .mockResolvedValueOnce({ status: 404, ok: false, text: async () => '' })
      .mockResolvedValueOnce({ status: 404, ok: false, text: async () => '' })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          type: 'file',
          content: Buffer.from('# Trinket').toString('base64'),
          sha: 't1',
          path: 'en/items/trinkets/smoke-pellet.trinket.mdx',
        }),
      });

    const { GET } = await import('@/app/api/corrections/read/route');
    const res = await GET(makeReq({ slug: 'items/trinkets/smoke-pellet' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.path).toBe('en/items/trinkets/smoke-pellet.trinket.mdx');
  });

  describe('without GitHub configuration', () => {
    beforeEach(() => {
      delete process.env.GITHUB_PAT;
      fsFetch.mockReset();
    });

    it('should serve the file from the working tree', async () => {
      fsFetch.mockResolvedValue({
        content: '# Aboleth',
        resolvedPath: '/repo/src/content/en/monsters/aboleth.sheet.mdx',
      });

      const { GET } = await import('@/app/api/corrections/read/route');
      const res = await GET(makeReq({ slug: 'monsters/aboleth' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(fsFetch).toHaveBeenCalledWith('en', 'monsters/aboleth');
      expect(body.content).toBe('# Aboleth');
      expect(body.sha).toBe('');
    });

    it('should 404 when the file is absent locally', async () => {
      fsFetch.mockResolvedValue(null);

      const { GET } = await import('@/app/api/corrections/read/route');
      const res = await GET(makeReq({ slug: 'monsters/nope' }));
      expect(res.status).toBe(404);
    });
  });
});
