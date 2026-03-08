/**
 * pgTrinketRepository Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL trinket repository adapter.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgTrinketRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgTrinketRepository: typeof import('@/lib/db/content/adapters/pg/pgTrinketRepository').pgTrinketRepository;
let query: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/content/adapters/pg/pgTrinketRepository');
  pgTrinketRepository = mod.pgTrinketRepository;
});

afterEach(() => vi.restoreAllMocks());

describe('pgTrinketRepository', () => {
  describe('list', () => {
    it('should return trinket data from query rows', async () => {
      const trinket = { slug: 'lucky-coin', title: 'Lucky Coin' };
      query.mockResolvedValue({ rows: [{ data: trinket }] });

      const result = await pgTrinketRepository.list('en');
      expect(result).toEqual([trinket]);
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.list('en');
      expect(result).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should return trinket when found', async () => {
      const trinket = { slug: 'lucky-coin', title: 'Lucky Coin' };
      query.mockResolvedValue({ rows: [{ data: trinket }] });

      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result).toEqual(trinket);
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await pgTrinketRepository.getBySlug('en', 'missing');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await pgTrinketRepository.getBySlug('en', 'lucky-coin');
      expect(result).toBeNull();
    });
  });
});
