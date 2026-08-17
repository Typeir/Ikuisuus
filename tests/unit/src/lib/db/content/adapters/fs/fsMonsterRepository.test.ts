/**
 * fsMonsterRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem monster repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsMonsterRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsMonsterRepository: typeof import('@/lib/db/content/adapters/fs/fsMonsterRepository').fsMonsterRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsMonsterRepository');
  fsMonsterRepository = mod.fsMonsterRepository;
});

afterEach(() => vi.restoreAllMocks());

const MONSTERS = [
  {
    slug: 'aboleth',
    title: 'Aboleth',
    cr: '10',
    size: 'Large',
    creatureType: 'Aberration',
  },
  {
    slug: 'goblin',
    subSlug: 'goblin-chief',
    title: 'Goblin Chief',
    cr: '1',
    size: 'Small',
    creatureType: 'Humanoid',
  },
];

describe('fsMonsterRepository', () => {
  describe('list', () => {
    it('should return all monster metadata', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.list('en');
      expect(result).toEqual(MONSTERS);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('disk failure');
      });
      const result = await fsMonsterRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return projected index entries', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.listIndex('en');
      expect(result).toEqual([
        {
          slug: 'aboleth',
          title: 'Aboleth',
          cr: '10',
          size: 'Large',
          creatureType: 'Aberration',
        },
        {
          slug: 'goblin-chief',
          title: 'Goblin Chief',
          cr: '1',
          size: 'Small',
          creatureType: 'Humanoid',
        },
      ]);
    });

    it('should exclude object statlets from the index', async () => {
      readMetadataFiles.mockReturnValue([
        ...MONSTERS,
        { slug: 'yskeia', subSlug: 'primeval-plating', title: 'Plating', kind: 'object' },
      ]);
      const result = await fsMonsterRepository.listIndex('en');
      expect(result.map((r) => r.slug)).not.toContain('primeval-plating');
    });

    it('should prefer subSlug over slug in index', async () => {
      readMetadataFiles.mockReturnValue([
        {
          slug: 'parent',
          subSlug: 'child',
          title: 'Child',
          cr: '2',
          size: 'Medium',
          creatureType: 'Beast',
        },
      ]);
      const result = await fsMonsterRepository.listIndex('en');
      expect(result[0].slug).toBe('child');
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsMonsterRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should find monster by slug', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.getBySlug('en', 'aboleth');
      expect(result?.title).toBe('Aboleth');
    });

    it('should find monster by subSlug', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.getBySlug('en', 'goblin-chief');
      expect(result?.title).toBe('Goblin Chief');
    });

    it('should return null when not found', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.getBySlug('en', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsMonsterRepository.getBySlug('en', 'aboleth');
      expect(result).toBeNull();
    });
  });

  describe('getAllBySlug', () => {
    it('should return every stat block sharing the file slug', async () => {
      readMetadataFiles.mockReturnValue([
        ...MONSTERS,
        { slug: 'goblin', subSlug: 'goblin-scout', title: 'Goblin Scout' },
      ]);
      const result = await fsMonsterRepository.getAllBySlug('en', 'goblin');
      expect(result.map((m) => m.title)).toEqual([
        'Goblin Chief',
        'Goblin Scout',
      ]);
    });

    it('should not match on subSlug', async () => {
      readMetadataFiles.mockReturnValue(MONSTERS);
      const result = await fsMonsterRepository.getAllBySlug(
        'en',
        'goblin-chief',
      );
      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsMonsterRepository.getAllBySlug('en', 'goblin');
      expect(result).toEqual([]);
    });
  });
});
