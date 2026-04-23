/**
 * @fileoverview Tests for the metadataBase URL resolver.
 *
 * @module tests/unit/src/lib/seo/resolveMetadataBase.test
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolveMetadataBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns SITE_URL when the env variable is set', async () => {
    vi.stubEnv('SITE_URL', 'https://library.example.com');
    vi.stubEnv('VERCEL_URL', '');
    const { resolveMetadataBase } =
      await import('@/lib/seo/resolveMetadataBase');
    expect(resolveMetadataBase().href).toBe('https://library.example.com/');
  });

  it('returns https VERCEL_URL when SITE_URL is absent', async () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('VERCEL_URL', 'my-app.vercel.app');
    const { resolveMetadataBase } =
      await import('@/lib/seo/resolveMetadataBase');
    expect(resolveMetadataBase().href).toBe('https://my-app.vercel.app/');
  });

  it('falls back to localhost when no env variables are set', async () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('VERCEL_URL', '');
    const { resolveMetadataBase } =
      await import('@/lib/seo/resolveMetadataBase');
    expect(resolveMetadataBase().href).toBe('http://localhost:3000/');
  });
});
