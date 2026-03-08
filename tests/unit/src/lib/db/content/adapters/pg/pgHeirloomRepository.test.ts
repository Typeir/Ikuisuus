/**
 * pgHeirloomRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL heirloom repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgHeirloomRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgHeirloomRepository: typeof import('@/lib/db/content/adapters/pg/pgHeirloomRepository').pgHeirloomRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgHeirloomRepository');
  pgHeirloomRepository = mod.pgHeirloomRepository;
});

afterEach(() => vi.restoreAllMocks());

describe('pgHeirloomRepository', () => {
  describe('list', () => {
    it('should return heirloom data from query rows', async () => {
      const heirloom = { slug: 'flame-tongue', title: 'Flame Tongue' };
      query.mockResolvedValue({ rows: [{ data: heirloom }] });

      const result = await pgHeirloomRepository.list('en');
      expect(result).toEqual([heirloom]);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return heirloom when found', async () => {
      const heirloom = { slug: 'flame-tongue', title: 'Flame Tongue' };
      query.mockResolvedValue({ rows: [{ data: heirloom }] });

      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result).toEqual(heirloom);
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgHeirloomRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgHeirloomRepository.getBySlug('en', 'flame-tongue');
      expect(result).toBeNull();
    });
  });
});
