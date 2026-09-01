/**
 * Auth Users API Route Unit Tests
 *
 * @fileoverview Tests for GET/POST /api/auth/users.
 *
 * @module tests/unit/src/app/api/auth/users/route.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExtractSession = vi.fn();
const mockGetUserAdapter = vi.fn();
const mockCreateUser = vi.fn();
const mockSafeParse = vi.fn();

vi.mock('@/lib/db/auth', () => ({
  extractSession: (...args: unknown[]) => mockExtractSession(...args),
  getUserAdapter: (...args: unknown[]) => mockGetUserAdapter(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  CreateUserRequestSchema: {
    safeParse: (...args: unknown[]) => mockSafeParse(...args),
  },
}));

let GET: typeof import('@/app/api/auth/users/route').GET;
let POST: typeof import('@/app/api/auth/users/route').POST;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('@/app/api/auth/users/route');
  GET = mod.GET;
  POST = mod.POST;
});

afterEach(() => vi.restoreAllMocks());

/**
 * Builds a fake NextRequest with optional auth header.
 *
 * @param {string | null} authHeader - Authorization header value
 * @param {unknown} [body] - JSON body for POST requests
 * @returns {object} NextRequest-like object
 */
const makeReq = (authHeader: string | null, body?: unknown) =>
  ({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? authHeader : null,
    },
    json:
      body !== undefined
        ? vi.fn().mockResolvedValue(body)
        : vi.fn().mockRejectedValue(new Error('no body')),
  }) as any;

describe('GET /api/auth/users', () => {
  it('should return 401 without auth', async () => {
    mockExtractSession.mockResolvedValue(null);
    const res = await GET(makeReq(null));
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    mockExtractSession.mockResolvedValue({ role: 'editor' });
    const res = await GET(makeReq('Bearer valid'));
    expect(res.status).toBe(403);
  });

  it('should return users list for admin', async () => {
    mockExtractSession.mockResolvedValue({ role: 'admin' });
    mockGetUserAdapter.mockReturnValue({
      listAll: vi
        .fn()
        .mockResolvedValue([
          {
            id: '1',
            username: 'admin',
            role: 'admin',
            passwordHash: 'HIDDEN',
            createdAt: '2025-01-01',
          },
        ]),
    });

    const res = await GET(makeReq('Bearer admin-token'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json[0].username).toBe('admin');
    expect(json[0].passwordHash).toBeUndefined();
  });
});

describe('POST /api/auth/users', () => {
  it('should return 401 without auth', async () => {
    mockExtractSession.mockResolvedValue(null);
    const res = await POST(makeReq(null, {}));
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid JSON', async () => {
    mockExtractSession.mockResolvedValue({ role: 'admin' });
    const req = {
      headers: { get: () => 'Bearer admin' },
      json: vi.fn().mockRejectedValue(new Error('parse')),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid schema', async () => {
    mockExtractSession.mockResolvedValue({ role: 'admin' });
    mockSafeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: 'bad input' }] },
    });
    const res = await POST(makeReq('Bearer admin', { username: '' }));
    expect(res.status).toBe(400);
  });

  it('should return 201 on success', async () => {
    mockExtractSession.mockResolvedValue({ role: 'admin' });
    mockSafeParse.mockReturnValue({
      success: true,
      data: { username: 'newbie', password: 'pass1234' },
    });
    mockCreateUser.mockResolvedValue({
      id: '2',
      username: 'newbie',
      role: 'editor',
      createdAt: '2025-01-01',
    });

    const res = await POST(
      makeReq('Bearer admin', { username: 'newbie', password: 'pass1234' }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.username).toBe('newbie');
  });

  it('should return 409 on duplicate', async () => {
    mockExtractSession.mockResolvedValue({ role: 'admin' });
    mockSafeParse.mockReturnValue({
      success: true,
      data: { username: 'dup', password: 'pass1234' },
    });
    mockCreateUser.mockRejectedValue(new Error('Username already exists'));

    const res = await POST(
      makeReq('Bearer admin', { username: 'dup', password: 'pass1234' }),
    );
    expect(res.status).toBe(409);
  });
});
