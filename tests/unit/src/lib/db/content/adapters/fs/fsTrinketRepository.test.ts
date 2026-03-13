/**
 * fsTrinketRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem trinket repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsTrinketRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsTrinketRepository: typeof import('@/lib/db/content/adapters/fs/fsTrinketRepository').fsTrinketRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsTrinketRepository');
  fsTrinketRepository = mod.fsTrinketRepository;
});

afterEach(() => vi.restoreAllMocks());

const TRINKETS = [
  { slug: 'lucky-coin', title: 'Lucky Coin' },
  { slug: 'old-compass', title: 'Old Compass' },
];

describe('fsTrinketRepository', () => {
  describe('list', () => {
    it('should return all trinket metadata', async () => {
      readMetadataFiles.mockReturnValue(TRINKETS);
      const result = await fsTrinketRepository.list('en');
      expect(result).toEqual(TRINKETS);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsTrinketRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find trinket by slug', async () => {
      readMetadataFiles.mockReturnValue(TRINKETS);
      const result = await fsTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result?.title).toBe('Lucky Coin');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(TRINKETS);
      const result = await fsTrinketRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result).toBeNull();
    });
  });
});
