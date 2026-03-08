/**
 * Auth Validate API Route Unit Tests
 *
 * @fileoverview Tests for GET /api/auth/validate.
 *
 * @module tests/unit/app/api/auth/validate/route
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExtractSession = vi.fn();

vi.mock('@/lib/db/auth', () => ({
  extractSession: (...args: unknown[]) => mockExtractSession(...args),
}));

let GET: typeof import('@/app/api/auth/validate/route').GET;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('@/app/api/auth/validate/route');
  GET = mod.GET;
});

afterEach(() => vi.restoreAllMocks());

const makeReq = (authHeader: string | null) =>
  ({
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? authHeader : null,
    },
  }) as any;

describe('GET /api/auth/validate', () => {
  it('should return 401 without token', async () => {
    mockExtractSession.mockResolvedValue(null);
    const res = await GET(makeReq(null));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.valid).toBe(false);
  });

  it('should return valid session for valid token', async () => {
    const session = { userId: '1', username: 'editor', role: 'editor' };
    mockExtractSession.mockResolvedValue(session);
    const res = await GET(makeReq('Bearer valid-token'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.session).toEqual(session);
  });
});
