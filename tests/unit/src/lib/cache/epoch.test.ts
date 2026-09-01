/**
 * @fileoverview Cache Epoch Source Unit Tests
 * @description Tests backend selection and the `none` backend's contract.
 *
 * @module tests/unit/src/lib/cache/epoch.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalBackend = process.env.CACHE_EPOCH_BACKEND;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (originalBackend === undefined) delete process.env.CACHE_EPOCH_BACKEND;
  else process.env.CACHE_EPOCH_BACKEND = originalBackend;
});

describe('cacheEpochSource', () => {
  it('answers null and swallows bumps on the none backend', async () => {
    delete process.env.CACHE_EPOCH_BACKEND;
    const { cacheEpochSource } = await import('@/lib/cache/epoch');

    expect(await cacheEpochSource.current()).toBeNull();
    await expect(cacheEpochSource.bump()).resolves.toBeUndefined();
  });

  it('throws on an unknown backend', async () => {
    process.env.CACHE_EPOCH_BACKEND = 'carrier-pigeon';
    await expect(import('@/lib/cache/epoch')).rejects.toThrow(
      'Unsupported cache epoch backend: carrier-pigeon',
    );
  });
});
