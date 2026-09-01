/**
 * Auth Login API Route Unit Tests
 *
 * @fileoverview Tests for POST /api/auth/login.
 *
 * @module tests/unit/src/app/api/auth/login/route.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/auth', () => ({
  login: vi.fn(),
  LoginRequestSchema: {
    safeParse: vi.fn(),
  },
}));

let POST: typeof import('@/app/api/auth/login/route').POST;
let mockLogin: ReturnType<typeof vi.fn>;
let mockSafeParse: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const auth = await import('@/lib/db/auth');
  mockLogin = auth.login as unknown as ReturnType<typeof vi.fn>;
  mockSafeParse = auth.LoginRequestSchema.safeParse as ReturnType<typeof vi.fn>;

  const mod = await import('@/app/api/auth/login/route');
  POST = mod.POST;
});

afterEach(() => vi.restoreAllMocks());

/**
 * Helper to create a minimal NextRequest-like object.
 *
 * @param {unknown} body - JSON body
 * @returns {object} NextRequest-compatible object
 */
const makeRequest = (body: unknown) =>
  ({
    json: vi.fn().mockResolvedValue(body),
  }) as any;

describe('POST /api/auth/login', () => {
  it('should return 200 with token on successful login', async () => {
    const body = { username: 'editor', password: 'test1234' };
    mockSafeParse.mockReturnValue({ success: true, data: body });
    mockLogin.mockResolvedValue({
      token: 'abc',
      user: { id: '1', username: 'editor', role: 'editor' },
    });

    const res = await POST(makeRequest(body));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.token).toBe('abc');
  });

  it('should return 400 for invalid JSON', async () => {
    const req = {
      json: vi.fn().mockRejectedValue(new Error('parse error')),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('should return 400 for invalid schema', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: 'Required' }] },
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Required');
  });

  it('should return 401 for wrong credentials', async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { username: 'x', password: 'y' },
    });
    mockLogin.mockResolvedValue({ error: 'Invalid credentials' });

    const res = await POST(makeRequest({ username: 'x', password: 'y' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Invalid credentials');
  });
});
