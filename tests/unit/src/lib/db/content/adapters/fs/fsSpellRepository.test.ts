/**
 * fsSpellRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem spell repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsSpellRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsSpellRepository: typeof import('@/lib/db/content/adapters/fs/fsSpellRepository').fsSpellRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsSpellRepository');
  fsSpellRepository = mod.fsSpellRepository;
});

afterEach(() => vi.restoreAllMocks());

const SPELLS = [
  { slug: 'fireball', title: 'Fireball', level: 3, school: 'evocation' },
  { slug: 'cure-wounds', title: 'Cure Wounds', level: 1, school: 'evocation' },
  { slug: 'shield', title: 'Shield', level: 1, school: 'abjuration' },
];

describe('fsSpellRepository', () => {
  describe('list', () => {
    it('should return all spells', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.list('en');
      expect(result).toEqual(SPELLS);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpellRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return sorted index entries', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.listIndex('en');
      expect(result[0].title).toBe('Cure Wounds');
      expect(result[1].title).toBe('Fireball');
      expect(result[2].title).toBe('Shield');
    });

    it('should project only slug, title, level, school', async () => {
      readMetadataFiles.mockReturnValue([
        {
          slug: 'x',
          title: 'X',
          level: 0,
          school: 'divination',
          extraField: true,
        },
      ]);
      const result = await fsSpellRepository.listIndex('en');
      expect(result[0]).toEqual({
        slug: 'x',
        title: 'X',
        level: 0,
        school: 'divination',
      });
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpellRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('listBySlugs', () => {
    it('should return all spells when slugs is empty', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.listBySlugs('en', []);
      expect(result).toEqual(SPELLS);
    });

    it('should filter by slugs', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('fireball');
    });

    it('should handle multiple slugs', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.listBySlugs('en', [
        'fireball',
        'shield',
      ]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find spell by slug', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.getBySlug('en', 'fireball');
      expect(result?.title).toBe('Fireball');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(SPELLS);
      const result = await fsSpellRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsSpellRepository.getBySlug('en', 'fireball');
      expect(result).toBeNull();
    });
  });
});
