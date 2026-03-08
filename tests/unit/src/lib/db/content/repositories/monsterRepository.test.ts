/**
 * monsterRepository Factory Unit Tests
 *
 * @fileoverview Tests for the monster repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/monsterRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsMonsterRepository', () => ({
  fsMonsterRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
    getBySlug: vi.fn(),
  },
}));
vi.mock('@/lib/db/content/adapters/pg/pgMonsterRepository', () => ({
  pgMonsterRepository: {
    list: vi.fn(),
    listIndex: vi.fn(),
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

describe('monsterRepository factory', () => {
  it('should default to fs adapter when METADATA_BACKEND is unset', async () => {
    delete process.env.METADATA_BACKEND;
    const { monsterRepository } =
      await import('@/lib/db/content/repositories/monsterRepository');
    const { fsMonsterRepository } =
      await import('@/lib/db/content/adapters/fs/fsMonsterRepository');
    expect(monsterRepository).toBe(fsMonsterRepository);
  });

  it('should use fs adapter when METADATA_BACKEND=fs', async () => {
    process.env.METADATA_BACKEND = 'fs';
    const { monsterRepository } =
      await import('@/lib/db/content/repositories/monsterRepository');
    const { fsMonsterRepository } =
      await import('@/lib/db/content/adapters/fs/fsMonsterRepository');
    expect(monsterRepository).toBe(fsMonsterRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { monsterRepository } =
      await import('@/lib/db/content/repositories/monsterRepository');
    const { pgMonsterRepository } =
      await import('@/lib/db/content/adapters/pg/pgMonsterRepository');
    expect(monsterRepository).toBe(pgMonsterRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/monsterRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });

  it('should export MonsterRepository interface type', async () => {
    delete process.env.METADATA_BACKEND;
    const mod = await import('@/lib/db/content/repositories/monsterRepository');
    expect(mod.monsterRepository).toBeDefined();
    expect(typeof mod.monsterRepository.list).toBe('function');
    expect(typeof mod.monsterRepository.listIndex).toBe('function');
    expect(typeof mod.monsterRepository.getBySlug).toBe('function');
  });
});
