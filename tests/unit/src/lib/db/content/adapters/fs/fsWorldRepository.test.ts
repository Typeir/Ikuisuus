/**
 * fsWorldRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem world repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsWorldRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsWorldRepository: typeof import('@/lib/db/content/adapters/fs/fsWorldRepository').fsWorldRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsWorldRepository');
  fsWorldRepository = mod.fsWorldRepository;
});

afterEach(() => vi.restoreAllMocks());

const WORLD = [
  { slug: 'ordovica', title: 'Ordovica' },
  { slug: 'taeda', title: 'Taeda' },
];

describe('fsWorldRepository', () => {
  describe('list', () => {
    it('should return all world metadata', async () => {
      readMetadataFiles.mockReturnValue(WORLD);
      expect(await fsWorldRepository.list('en')).toEqual(WORLD);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      expect(await fsWorldRepository.list('en')).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find a world entry by slug', async () => {
      readMetadataFiles.mockReturnValue(WORLD);
      const result = await fsWorldRepository.getBySlug('en', 'ordovica');
      expect(result?.title).toBe('Ordovica');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(WORLD);
      expect(await fsWorldRepository.getBySlug('en', 'missing')).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      expect(await fsWorldRepository.getBySlug('en', 'ordovica')).toBeNull();
    });
  });
});
