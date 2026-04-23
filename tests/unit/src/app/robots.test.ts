/**
 * @fileoverview Tests for the robots.txt route.
 *
 * @module tests/unit/src/app/robots.test
 */
import robots from '@/app/robots';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/seo', () => ({
  resolveMetadataBase: vi
    .fn()
    .mockReturnValue(new URL('https://ikuisuus.vercel.app')),
}));

describe('robots', () => {
  it('allows all user agents', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.userAgent).toBe('*');
    expect(rules.allow).toBe('/');
  });

  it('points sitemap to canonical base URL', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://ikuisuus.vercel.app/sitemap.xml');
  });
});
