/**
 * bloodlineRepository Factory Unit Tests
 *
 * @fileoverview Tests for the bloodline repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/bloodlineRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsBloodlineRepository', () => ({
  fsBloodlineRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgBloodlineRepository', () => ({
  pgBloodlineRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));

const originalEnv = process.env.METADATA_BACKEND;

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  if (originalEnv === undefined) {
    delete process.env.METADATA_BACKEND;
  } else {
    process.env.METADATA_BACKEND = originalEnv;
  }
});

describe('bloodlineRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { bloodlineRepository } =
      await import('@/lib/db/content/repositories/bloodlineRepository');
    const { fsBloodlineRepository } =
      await import('@/lib/db/content/adapters/fs/fsBloodlineRepository');
    expect(bloodlineRepository).toBe(fsBloodlineRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { bloodlineRepository } =
      await import('@/lib/db/content/repositories/bloodlineRepository');
    const { pgBloodlineRepository } =
      await import('@/lib/db/content/adapters/pg/pgBloodlineRepository');
    expect(bloodlineRepository).toBe(pgBloodlineRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/bloodlineRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
