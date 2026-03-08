/**
 * spellRepository Factory Unit Tests
 *
 * @fileoverview Tests for the spell repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/spellRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsSpellRepository', () => ({
  fsSpellRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    listBySlugs: vi.fn(),
    getBySlug: vi.fn(),
  },
}));
vi.mock('@/lib/db/content/adapters/pg/pgSpellRepository', () => ({
  pgSpellRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    listBySlugs: vi.fn(),
    getBySlug: vi.fn(),
  },
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

describe('spellRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { spellRepository } =
      await import('@/lib/db/content/repositories/spellRepository');
    const { fsSpellRepository } =
      await import('@/lib/db/content/adapters/fs/fsSpellRepository');
    expect(spellRepository).toBe(fsSpellRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { spellRepository } =
      await import('@/lib/db/content/repositories/spellRepository');
    const { pgSpellRepository } =
      await import('@/lib/db/content/adapters/pg/pgSpellRepository');
    expect(spellRepository).toBe(pgSpellRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/spellRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });

  it('should expose listBySlugs method', async () => {
    delete process.env.METADATA_BACKEND;
    const { spellRepository } =
      await import('@/lib/db/content/repositories/spellRepository');
    expect(typeof spellRepository.listBySlugs).toBe('function');
  });
});
