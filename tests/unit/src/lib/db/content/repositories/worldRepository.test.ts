/**
 * worldRepository Factory Unit Tests
 *
 * @fileoverview Tests for the world repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/worldRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsWorldRepository', () => ({
  fsWorldRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgWorldRepository', () => ({
  pgWorldRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('worldRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { worldRepository } =
      await import('@/lib/db/content/repositories/worldRepository');
    const { fsWorldRepository } =
      await import('@/lib/db/content/adapters/fs/fsWorldRepository');
    expect(worldRepository).toBe(fsWorldRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { worldRepository } =
      await import('@/lib/db/content/repositories/worldRepository');
    const { pgWorldRepository } =
      await import('@/lib/db/content/adapters/pg/pgWorldRepository');
    expect(worldRepository).toBe(pgWorldRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/worldRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
