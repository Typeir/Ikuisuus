/**
 * fsFeatRepository Unit Tests
 *
 * @fileoverview Tests for the filesystem feat repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/fs/fsFeatRepository
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let fsFeatRepository: typeof import('@/lib/db/content/adapters/fs/fsFeatRepository').fsFeatRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/fs/fsFeatRepository');
  fsFeatRepository = mod.fsFeatRepository;
});

afterEach(() => vi.restoreAllMocks());

const FEATS = [
  {
    slug: 'tough',
    title: 'Tough',
    file: 'src/content/en/character-creation/feats/tough.mdx',
    link: '/library/character-creation/feats/tough',
    hasPrerequisite: false,
    tags: [],
  },
  {
    slug: 'great-weapon-master',
    title: 'Great Weapon Master',
    file: 'src/content/en/character-creation/feats/great-weapon-master.mdx',
    link: '/library/character-creation/feats/great-weapon-master',
    hasPrerequisite: true,
    prerequisite: 'Prerequisite: Great Weapon Fighting style',
    tags: [],
  },
];

describe('fsFeatRepository', () => {
  describe('list', () => {
    it('returns all feat metadata', async () => {
      readMetadataFiles.mockReturnValue(FEATS);
      const result = await fsFeatRepository.list('en');
      expect(result).toEqual(FEATS);
    });

    it('filters records that are missing required fields', async () => {
      readMetadataFiles.mockReturnValue([{ slug: 'tough' }, FEATS[0], null]);
      const result = await fsFeatRepository.list('en');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('tough');
    });

    it('returns empty array on error', async () => {
      readMetadataFiles.mockImplementation(() => {
        throw new Error('fail');
      });
      const result = await fsFeatRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('returns the matching feat', async () => {
      readMetadataFiles.mockReturnValue(FEATS);
      const result = await fsFeatRepository.getBySlug('en', 'tough');
      expect(result?.slug).toBe('tough');
    });

    it('returns null when not found', async () => {
      readMetadataFiles.mockReturnValue(FEATS);
      const result = await fsFeatRepository.getBySlug('en', 'unknown');
      expect(result).toBeNull();
    });
  });
});
