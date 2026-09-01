/**
 * @fileoverview Unit Tests — content-webhook API route
 * @description Validates the POST handler for the content repo webhook including
 * secret validation, action dispatch, IP ban logic, and error handling.
 *
 * @module tests/unit/src/app/api/content-webhook/route.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBanIp = vi.fn();

vi.mock('@/lib/security/bannedIps', () => ({
  banIp: (...args: unknown[]) => mockBanIp(...args),
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

import { POST } from '@/app/api/content-webhook/route';
import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for the content-webhook endpoint.
 *
 * @param {unknown} body - Request body
 * @param {Record<string, string>} headers - Request headers
 * @returns {NextRequest} Mock request
 */
function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest('http://localhost/api/content-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/content-webhook', () => {
  const SECRET = 'test-webhook-secret-123';

  beforeEach(() => {
    process.env.CONTENT_WEBHOOK_SECRET = SECRET;
    mockBanIp.mockReset();
  });

  afterEach(() => {
    delete process.env.CONTENT_WEBHOOK_SECRET;
  });

  it('returns 503 when CONTENT_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.CONTENT_WEBHOOK_SECRET;

    const res = await POST(makeRequest({ action: 'ban-ip', ip: '1.2.3.4' }));

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain('not configured');
  });

  it('returns 401 when the webhook secret header is missing', async () => {
    const res = await POST(makeRequest({ action: 'ban-ip', ip: '1.2.3.4' }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Invalid secret');
  });

  it('returns 401 when the webhook secret header is wrong', async () => {
    const res = await POST(
      makeRequest(
        { action: 'ban-ip', ip: '1.2.3.4' },
        { 'x-webhook-secret': 'wrong-secret-123' },
      ),
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/content-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-webhook-secret': SECRET,
      },
      body: 'not-valid-json',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('returns 400 for an unknown action', async () => {
    const res = await POST(
      makeRequest({ action: 'unknown-action' }, { 'x-webhook-secret': SECRET }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Unknown action');
  });

  it('returns 400 when ip field is missing for ban-ip action', async () => {
    const res = await POST(
      makeRequest({ action: 'ban-ip' }, { 'x-webhook-secret': SECRET }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing or invalid: ip');
  });

  it('returns 400 when ip field is a malformed address', async () => {
    const res = await POST(
      makeRequest(
        { action: 'ban-ip', ip: 'not_an_ip!!' },
        { 'x-webhook-secret': SECRET },
      ),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Malformed IP address');
  });

  it('returns 200 and bans the IP on a successful ban-ip request', async () => {
    mockBanIp.mockResolvedValue({ range: '192.168.1.0/24' });

    const res = await POST(
      makeRequest(
        { action: 'ban-ip', ip: '192.168.1.42', reason: 'Profanity' },
        { 'x-webhook-secret': SECRET },
      ),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.banned).toBe(true);
    expect(json.range).toBe('192.168.1.0/24');
    expect(mockBanIp).toHaveBeenCalledWith('192.168.1.42', 'Profanity');
  });

  it('uses default reason when reason field is absent', async () => {
    mockBanIp.mockResolvedValue({ range: '10.0.0.0/24' });

    await POST(
      makeRequest(
        { action: 'ban-ip', ip: '10.0.0.1' },
        { 'x-webhook-secret': SECRET },
      ),
    );

    expect(mockBanIp).toHaveBeenCalledWith(
      '10.0.0.1',
      expect.stringContaining('Profanity'),
    );
  });

  it('returns 500 when banIp throws an error', async () => {
    mockBanIp.mockRejectedValue(new Error('DB connection failed'));

    const res = await POST(
      makeRequest(
        { action: 'ban-ip', ip: '1.2.3.4' },
        { 'x-webhook-secret': SECRET },
      ),
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Failed to ban IP');
  });
});
