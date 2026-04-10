/**
 * vocationRepository Factory Unit Tests
 *
 * @fileoverview Tests for the vocation repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/vocationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsVocationRepository', () => ({
  fsVocationRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgVocationRepository', () => ({
  pgVocationRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('vocationRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { vocationRepository } =
      await import('@/lib/db/content/repositories/vocationRepository');
    const { fsVocationRepository } =
      await import('@/lib/db/content/adapters/fs/fsVocationRepository');
    expect(vocationRepository).toBe(fsVocationRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { vocationRepository } =
      await import('@/lib/db/content/repositories/vocationRepository');
    const { pgVocationRepository } =
      await import('@/lib/db/content/adapters/pg/pgVocationRepository');
    expect(vocationRepository).toBe(pgVocationRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/vocationRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
