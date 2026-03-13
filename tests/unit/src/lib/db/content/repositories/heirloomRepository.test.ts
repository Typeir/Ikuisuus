/**
 * heirloomRepository Factory Unit Tests
 *
 * @fileoverview Tests for the heirloom repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/heirloomRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsHeirloomRepository', () => ({
  fsHeirloomRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgHeirloomRepository', () => ({
  pgHeirloomRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('heirloomRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { heirloomRepository } =
      await import('@/lib/db/content/repositories/heirloomRepository');
    const { fsHeirloomRepository } =
      await import('@/lib/db/content/adapters/fs/fsHeirloomRepository');
    expect(heirloomRepository).toBe(fsHeirloomRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { heirloomRepository } =
      await import('@/lib/db/content/repositories/heirloomRepository');
    const { pgHeirloomRepository } =
      await import('@/lib/db/content/adapters/pg/pgHeirloomRepository');
    expect(heirloomRepository).toBe(pgHeirloomRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/heirloomRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
