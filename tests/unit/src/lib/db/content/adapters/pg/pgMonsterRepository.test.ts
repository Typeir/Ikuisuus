/**
 * pgMonsterRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL monster repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgMonsterRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgMonsterRepository: typeof import('@/lib/db/content/adapters/pg/pgMonsterRepository').pgMonsterRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgMonsterRepository');
  pgMonsterRepository = mod.pgMonsterRepository;
});

afterEach(() => vi.restoreAllMocks());

describe('pgMonsterRepository', () => {
  describe('list', () => {
    it('should return monster data from query rows', async () => {
      const monster = { slug: 'aboleth', title: 'Aboleth' };
      query.mockResolvedValue({ rows: [{ data: monster }] });

      const result = await pgMonsterRepository.list('en');

      expect(result).toEqual([monster]);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT data FROM content_metadata'),
        ['monsters', 'en'],
      );
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('connection refused'));
      const result = await pgMonsterRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index projection rows', async () => {
      const rows = [
        {
          slug: 'aboleth',
          title: 'Aboleth',
          cr: '10',
          size: 'Large',
          creatureType: 'Aberration',
        },
      ];
      query.mockResolvedValue({ rows });

      const result = await pgMonsterRepository.listIndex('en');

      expect(result).toEqual(rows);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('COALESCE'), [
        'monsters',
        'en',
      ]);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return monster when found', async () => {
      const monster = { slug: 'aboleth', title: 'Aboleth' };
      query.mockResolvedValue({ rows: [{ data: monster }] });

      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');

      expect(result).toEqual(monster);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('subSlug'), [
        'monsters',
        'en',
        'aboleth',
      ]);
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgMonsterRepository.getBySlug('en', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgMonsterRepository.getBySlug('en', 'aboleth');
      expect(result).toBeNull();
    });
  });
});
