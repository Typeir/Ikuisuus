/**
 * fsRuleRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem rule repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsRuleRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsRuleRepository: typeof import('@/lib/db/content/adapters/fs/fsRuleRepository').fsRuleRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsRuleRepository');
  fsRuleRepository = mod.fsRuleRepository;
});

afterEach(() => vi.restoreAllMocks());

const RULES = [
  { slug: 'conditions', title: 'Conditions' },
  { slug: 'damage', title: 'Damage' },
];

describe('fsRuleRepository', () => {
  describe('list', () => {
    it('should return all rule metadata', async () => {
      readMetadataFiles.mockReturnValue(RULES);
      expect(await fsRuleRepository.list('en')).toEqual(RULES);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      expect(await fsRuleRepository.list('en')).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find a rules page by slug', async () => {
      readMetadataFiles.mockReturnValue(RULES);
      const result = await fsRuleRepository.getBySlug('en', 'conditions');
      expect(result?.title).toBe('Conditions');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(RULES);
      expect(await fsRuleRepository.getBySlug('en', 'missing')).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      expect(await fsRuleRepository.getBySlug('en', 'conditions')).toBeNull();
    });
  });
});
