/**
 * keywordLinkRepository Factory Unit Tests
 *
 * @fileoverview Tests for the keywordLink repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/keywordLinkRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsKeywordLinkRepository', () => ({
  fsKeywordLinkRepository: { listLinks: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgKeywordLinkRepository', () => ({
  pgKeywordLinkRepository: { listLinks: vi.fn() },
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

describe('keywordLinkRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { keywordLinkRepository } =
      await import('@/lib/db/content/repositories/keywordLinkRepository');
    const { fsKeywordLinkRepository } =
      await import('@/lib/db/content/adapters/fs/fsKeywordLinkRepository');
    expect(keywordLinkRepository).toBe(fsKeywordLinkRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { keywordLinkRepository } =
      await import('@/lib/db/content/repositories/keywordLinkRepository');
    const { pgKeywordLinkRepository } =
      await import('@/lib/db/content/adapters/pg/pgKeywordLinkRepository');
    expect(keywordLinkRepository).toBe(pgKeywordLinkRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/keywordLinkRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
