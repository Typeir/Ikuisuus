/**
 * DraftRepository Factory Unit Tests
 *
 * @fileoverview Tests the draft repository factory export resolves
 * to pgDraftRepository.
 *
 * @module tests/unit/lib/db/content/repositories/draftRepository
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/pg/pgDraftRepository', () => ({
  pgDraftRepository: {
    upsert: vi.fn(),
    findActive: vi.fn(),
    archive: vi.fn(),
  },
}));

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('draftRepository factory', () => {
  it('should resolve to pgDraftRepository', async () => {
    const { draftRepository } =
      await import('@/lib/db/content/repositories/draftRepository');
    const { pgDraftRepository } =
      await import('@/lib/db/content/adapters/pg/pgDraftRepository');
    expect(draftRepository).toBe(pgDraftRepository);
  });

  it('should export the DraftRepository interface methods', async () => {
    const { draftRepository } =
      await import('@/lib/db/content/repositories/draftRepository');
    expect(typeof draftRepository.upsert).toBe('function');
    expect(typeof draftRepository.findActive).toBe('function');
    expect(typeof draftRepository.archive).toBe('function');
  });
});
