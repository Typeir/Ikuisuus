/**
 * PostgreSQL Pool Unit Tests
 *
 * @fileoverview Tests for the shared PostgreSQL connection pool.
 *
 * @module tests/unit/lib/db/postgres/pool
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockQuery = vi.fn();
const mockEnd = vi.fn();

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: mockQuery,
    end: mockEnd,
  })),
}));

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
  mockQuery.mockReset();
  mockEnd.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

/**
 * Tests use a single module import per describe block to
 * avoid the singleton pool state leaking between tests.
 */
describe('postgres/pool', () => {
  describe('getPool', () => {
    it('should create a pool and return it', async () => {
      vi.resetModules();
      const { getPool } = await import('@/lib/db/postgres/pool');
      const pool = getPool();
      expect(pool).toBeDefined();
      expect(pool).toHaveProperty('query');
    });

    it('should return the same pool on subsequent calls', async () => {
      vi.resetModules();
      const { getPool } = await import('@/lib/db/postgres/pool');
      const pool1 = getPool();
      const pool2 = getPool();
      expect(pool1).toBe(pool2);
    });

    it('should throw when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      vi.resetModules();
      const { getPool } = await import('@/lib/db/postgres/pool');
      expect(() => getPool()).toThrow('DATABASE_URL');
    });
  });

  describe('query', () => {
    it('should delegate to pool.query and pass params', async () => {
      vi.resetModules();
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      const { query } = await import('@/lib/db/postgres/pool');

      const result = await query('SELECT * FROM t WHERE id = $1', ['abc']);
      expect(result.rows).toEqual([{ id: 1 }]);
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM t WHERE id = $1', [
        'abc',
      ]);
    });
  });

  describe('closePool', () => {
    it('should call pool.end() and be safe when no pool exists', async () => {
      vi.resetModules();
      mockEnd.mockResolvedValue(undefined);
      const { getPool, closePool } = await import('@/lib/db/postgres/pool');

      /** Should be safe when no pool exists yet */
      await expect(closePool()).resolves.toBeUndefined();

      /** Create pool then close */
      getPool();
      await closePool();
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});
