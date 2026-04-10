/**
 * specializationRepository Factory Unit Tests
 *
 * @fileoverview Tests for the specialization repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/specializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsSpecializationRepository', () => ({
  fsSpecializationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
    listByVocation: vi.fn(),
  },
}));
vi.mock('@/lib/db/content/adapters/pg/pgSpecializationRepository', () => ({
  pgSpecializationRepository: {
    list: vi.fn(),
    getBySlug: vi.fn(),
    listByVocation: vi.fn(),
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

describe('specializationRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { specializationRepository } =
      await import('@/lib/db/content/repositories/specializationRepository');
    const { fsSpecializationRepository } =
      await import('@/lib/db/content/adapters/fs/fsSpecializationRepository');
    expect(specializationRepository).toBe(fsSpecializationRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { specializationRepository } =
      await import('@/lib/db/content/repositories/specializationRepository');
    const { pgSpecializationRepository } =
      await import('@/lib/db/content/adapters/pg/pgSpecializationRepository');
    expect(specializationRepository).toBe(pgSpecializationRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/specializationRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
