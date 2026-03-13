/**
 * trinketRepository Factory Unit Tests
 *
 * @fileoverview Tests for the trinket repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/trinketRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsTrinketRepository', () => ({
  fsTrinketRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgTrinketRepository', () => ({
  pgTrinketRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('trinketRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { trinketRepository } =
      await import('@/lib/db/content/repositories/trinketRepository');
    const { fsTrinketRepository } =
      await import('@/lib/db/content/adapters/fs/fsTrinketRepository');
    expect(trinketRepository).toBe(fsTrinketRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { trinketRepository } =
      await import('@/lib/db/content/repositories/trinketRepository');
    const { pgTrinketRepository } =
      await import('@/lib/db/content/adapters/pg/pgTrinketRepository');
    expect(trinketRepository).toBe(pgTrinketRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/trinketRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
