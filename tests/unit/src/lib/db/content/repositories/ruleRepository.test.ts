/**
 * ruleRepository Factory Unit Tests
 *
 * @fileoverview Tests for the rule repository factory + env var switching.
 *
 * @module tests/unit/lib/db/content/repositories/ruleRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/fsRuleRepository', () => ({
  fsRuleRepository: { list: vi.fn(), getBySlug: vi.fn() },
}));
vi.mock('@/lib/db/content/adapters/pg/pgRuleRepository', () => ({
  pgRuleRepository: { list: vi.fn(), getBySlug: vi.fn() },
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

describe('ruleRepository factory', () => {
  it('should default to fs adapter', async () => {
    delete process.env.METADATA_BACKEND;
    const { ruleRepository } =
      await import('@/lib/db/content/repositories/ruleRepository');
    const { fsRuleRepository } =
      await import('@/lib/db/content/adapters/fs/fsRuleRepository');
    expect(ruleRepository).toBe(fsRuleRepository);
  });

  it('should use pg adapter when METADATA_BACKEND=pg', async () => {
    process.env.METADATA_BACKEND = 'pg';
    const { ruleRepository } =
      await import('@/lib/db/content/repositories/ruleRepository');
    const { pgRuleRepository } =
      await import('@/lib/db/content/adapters/pg/pgRuleRepository');
    expect(ruleRepository).toBe(pgRuleRepository);
  });

  it('should throw for unknown backend', async () => {
    process.env.METADATA_BACKEND = 'redis';
    await expect(
      import('@/lib/db/content/repositories/ruleRepository'),
    ).rejects.toThrow('Unsupported metadata backend');
  });
});
