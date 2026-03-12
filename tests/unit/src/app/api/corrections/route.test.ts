/**
 * Corrections Submit API Route Unit Tests
 *
 * @fileoverview Tests for POST /api/corrections (branch + commit + PR workflow).
 *
 * @module tests/unit/app/api/corrections/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExtractSession = vi.fn();
const mockIsIpBanned = vi.fn();
const mockWriteAuditLog = vi.fn();
const mockDraftUpsert = vi.fn();

vi.mock('@/lib/db/auth', () => ({
  extractSession: (...args: unknown[]) => mockExtractSession(...args),
}));
vi.mock('@/lib/db/auditLog', () => ({
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}));
vi.mock('@/lib/security/bannedIps', () => ({
  isIpBanned: (...args: unknown[]) => mockIsIpBanned(...args),
}));
vi.mock('@/lib/db/content/repositories/draftRepository', () => ({
  draftRepository: {
    upsert: (...args: unknown[]) => mockDraftUpsert(...args),
  },
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      message: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const originalEnv = { ...process.env };

let POST: typeof import('@/app/api/corrections/route').POST;

beforeEach(async () => {
  vi.resetModules();
  process.env.CORRECTIONS_SECRET = 'secret';
  process.env.CONTENT_REPO_OWNER = 'owner';
  process.env.CONTENT_REPO_NAME = 'repo';
  process.env.GITHUB_PAT = 'ghp_test';

  mockIsIpBanned.mockResolvedValue({ banned: false });
  mockDraftUpsert.mockResolvedValue({
    id: 'draft-1',
    locale: 'en',
    slug: 'test',
    status: 'active',
  });
  mockWriteAuditLog.mockResolvedValue(undefined);

  const mod = await import('@/app/api/corrections/route');
  POST = mod.POST;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

/**
 * Builds a fake NextRequest for the corrections POST endpoint.
 *
 * @param {object} body - JSON body
 * @param {string} [authHeader] - Authorization header value
 * @returns {object} NextRequest-like object
 */
const makeReq = (body: unknown, authHeader = 'Bearer valid-token') =>
  ({
    url: 'http://localhost/api/corrections',
    headers: {
      get: (name: string) => {
        const map: Record<string, string | null> = {
          authorization: authHeader,
          'x-forwarded-for': '1.2.3.4',
          'content-length': '100',
        };
        return map[name.toLowerCase()] ?? null;
      },
      forEach: (cb: (v: string, k: string) => void) => {
        cb(authHeader, 'authorization');
        cb('1.2.3.4', 'x-forwarded-for');
        cb('100', 'content-length');
      },
    },
    json: vi.fn().mockResolvedValue(body),
  }) as any;

describe('POST /api/corrections', () => {
  it('should return 503 when not configured', async () => {
    delete process.env.CORRECTIONS_SECRET;
    vi.resetModules();
    const mod = await import('@/app/api/corrections/route');
    const res = await mod.POST(makeReq({}));
    expect(res.status).toBe(503);
  });

  it('should return 403 for banned IP', async () => {
    mockIsIpBanned.mockResolvedValue({
      banned: true,
      entry: { range: '1.2.3.0/24', reason: 'spam' },
    });
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(403);
  });

  it('should return 401 for missing session', async () => {
    mockExtractSession.mockResolvedValue(null);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid JSON', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });
    const req = {
      ...makeReq({}),
      json: vi.fn().mockRejectedValue(new Error('parse')),
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for missing path', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });
    const res = await POST(makeReq({ content: 'abc', baseSha: 'sha' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('path');
  });

  it('should return 400 for missing content', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });
    const res = await POST(makeReq({ path: 'en/test.mdx', baseSha: 'sha' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('content');
  });

  it('should return 400 for missing baseSha on edits', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });
    const res = await POST(makeReq({ path: 'en/test.mdx', content: '# hi' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('baseSha');
  });

  it('should return 400 for path traversal', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });
    const res = await POST(
      makeReq({ path: '../etc/passwd', content: 'x', baseSha: 'sha' }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid path');
  });

  it('should save a draft on successful PR creation', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'mainSha' } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ html_url: 'https://github.com/org/repo/pull/50' }),
      });

    const res = await POST(
      makeReq({
        path: 'en/world/aeridas.mdx',
        content: '# Edited Aeridas',
        baseSha: 'abc123',
      }),
    );

    expect(res.status).toBe(201);
    expect(mockDraftUpsert).toHaveBeenCalledWith({
      locale: 'en',
      slug: 'world/aeridas',
      content: '# Edited Aeridas',
    });
  });

  it('should return 201 on successful PR creation', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    /** GitHub API chain: get ref → create branch → commit → open PR */
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'mainSha' } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ html_url: 'https://github.com/org/repo/pull/42' }),
      });

    const res = await POST(
      makeReq({
        path: 'en/monsters/aboleth.sheet.mdx',
        content: '# Updated',
        baseSha: 'abc123',
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.prUrl).toBe('https://github.com/org/repo/pull/42');
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted' }),
    );
  });

  it('should return 409 on conflict', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    /** get ref → create branch → commit returns 409 */
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'mainSha' } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'conflict',
      });

    const res = await POST(
      makeReq({
        path: 'en/test.mdx',
        content: '# x',
        baseSha: 'old',
      }),
    );

    expect(res.status).toBe(409);
  });

  it('should allow new file creation without baseSha', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: { sha: 'mainSha' } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ html_url: 'https://github.com/org/repo/pull/99' }),
      });

    const res = await POST(
      makeReq({
        path: 'en/new/file.mdx',
        content: '# New',
        isNew: true,
      }),
    );

    expect(res.status).toBe(201);
  });

  it('should return 413 for oversized payload', async () => {
    mockExtractSession.mockResolvedValue({ username: 'editor' });

    const req = {
      url: 'http://localhost/api/corrections',
      headers: {
        get: (name: string) => {
          const map: Record<string, string | null> = {
            authorization: 'Bearer valid-token',
            'x-forwarded-for': '1.2.3.4',
            'content-length': '999999',
          };
          return map[name.toLowerCase()] ?? null;
        },
        forEach: vi.fn(),
      },
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
