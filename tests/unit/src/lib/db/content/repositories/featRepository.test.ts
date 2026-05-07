/**
 * featRepository Factory Unit Tests
 *
 * @fileoverview Tests for the feat repository factory.
 *
 * @module tests/unit/lib/db/content/repositories/featRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsFeatRepository', () => ({
  fsFeatRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgFeatRepository', () => ({
  pgFeatRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('featRepository factory', () => {
  it('defaults to the fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    vi.resetModules();
    const { featRepository } = await import(
      '@/lib/db/content/repositories/featRepository'
    );
    const { fsFeatRepository } = await import(
      '@/lib/db/content/adapters/fs/fsFeatRepository'
    );
    expect(featRepository).toBe(fsFeatRepository);
  });

  it('returns the pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    vi.resetModules();
    const { featRepository } = await import(
      '@/lib/db/content/repositories/featRepository'
    );
    const { pgFeatRepository } = await import(
      '@/lib/db/content/adapters/pg/pgFeatRepository'
    );
    expect(featRepository).toBe(pgFeatRepository);
  });

  it('throws on an unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    vi.resetModules();
    await expect(
      import('@/lib/db/content/repositories/featRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
