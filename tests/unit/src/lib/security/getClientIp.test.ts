/**
 * Client IP Extraction Unit Tests
 *
 * @fileoverview Tests for the provider-agnostic getClientIp utility.
 *
 * @module tests/unit/src/lib/security/getClientIp.test
 */

import { getClientIp } from '@/lib/security/getClientIp';
import { describe, expect, it } from 'vitest';

/**
 * Creates a minimal NextRequest-like object with header values.
 *
 * @param {Record<string, string | null>} headers - Header map
 * @returns {any} Minimal request mock
 */
const makeReq = (headers: Record<string, string | null>): any => ({
  headers: {
    get: (name: string) => headers[name.toLowerCase()] ?? null,
  },
});

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should fall back to x-real-ip', () => {
    const req = makeReq({ 'x-real-ip': '10.0.0.1' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('should return unknown when no IP headers present', () => {
    const req = makeReq({});
    expect(getClientIp(req)).toBe('unknown');
  });

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const req = makeReq({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '10.0.0.1',
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should trim whitespace from x-forwarded-for', () => {
    const req = makeReq({ 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });
});
