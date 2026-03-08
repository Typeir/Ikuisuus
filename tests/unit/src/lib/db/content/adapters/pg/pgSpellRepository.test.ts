/**
 * pgSpellRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL spell repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgSpellRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgSpellRepository: typeof import('@/lib/db/content/adapters/pg/pgSpellRepository').pgSpellRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgSpellRepository');
  pgSpellRepository = mod.pgSpellRepository;
});

afterEach(() => vi.restoreAllMocks());

describe('pgSpellRepository', () => {
  describe('list', () => {
    it('should return spell data from query rows', async () => {
      const spell = { slug: 'fireball', title: 'Fireball' };
      query.mockResolvedValue({ rows: [{ data: spell }] });

      const result = await pgSpellRepository.list('en');
      expect(result).toEqual([spell]);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('listIndex', () => {
    it('should return index rows', async () => {
      const rows = [
        { slug: 'fireball', title: 'Fireball', level: 3, school: 'evocation' },
      ];
      query.mockResolvedValue({ rows });

      const result = await pgSpellRepository.listIndex('en');
      expect(result).toEqual(rows);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listIndex('en');
      expect(result).toEqual([]);
    });
  });

  describe('listBySlugs', () => {
    it('should call list when slugs is empty', async () => {
      const spell = { slug: 'fireball', title: 'Fireball' };
      query.mockResolvedValue({ rows: [{ data: spell }] });

      const result = await pgSpellRepository.listBySlugs('en', []);
      expect(result).toEqual([spell]);
    });

    it('should filter with ANY when slugs are provided', async () => {
      const spell = { slug: 'fireball', title: 'Fireball' };
      query.mockResolvedValue({ rows: [{ data: spell }] });

      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);

      expect(result).toEqual([spell]);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('ANY'), [
        'spells',
        'en',
        ['fireball'],
      ]);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.listBySlugs('en', ['fireball']);
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return spell when found', async () => {
      const spell = { slug: 'fireball', title: 'Fireball' };
      query.mockResolvedValue({ rows: [{ data: spell }] });

      const result = await pgSpellRepository.getBySlug('en', 'fireball');
      expect(result).toEqual(spell);
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgSpellRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgSpellRepository.getBySlug('en', 'fireball');
      expect(result).toBeNull();
    });
  });
});
