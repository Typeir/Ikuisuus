/**
 * fsHeirloomRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem heirloom repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsHeirloomRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsHeirloomRepository: typeof import('@/lib/db/content/adapters/fs/fsHeirloomRepository').fsHeirloomRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsHeirloomRepository');
  fsHeirloomRepository = mod.fsHeirloomRepository;
});

afterEach(() => vi.restoreAllMocks());

const HEIRLOOMS = [
  { slug: 'flame-tongue', title: 'Flame Tongue', file: 'f.mdx', link: '/l' },
  { slug: 'frostbrand', title: 'Frostbrand', file: 'f2.mdx', link: '/l2' },
];

describe('fsHeirloomRepository', () => {
  describe('list', () => {
    it('should return all heirloom metadata', async () => {
      readMetadataFiles.mockReturnValue(HEIRLOOMS);
      const result = await fsHeirloomRepository.list('en');
      expect(result).toEqual(HEIRLOOMS);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsHeirloomRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find heirloom by slug', async () => {
      readMetadataFiles.mockReturnValue(HEIRLOOMS);
      const result = await fsHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result?.title).toBe('Flame Tongue');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(HEIRLOOMS);
      const result = await fsHeirloomRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result).toBeNull();
    });
  });
});
