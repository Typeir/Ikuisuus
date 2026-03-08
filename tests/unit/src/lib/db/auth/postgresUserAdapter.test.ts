/**
 * PostgreSQL User Adapter Unit Tests
 *
 * @fileoverview Tests for the PostgreSQL user adapter.
 *
 * @module tests/unit/lib/db/auth/postgresUserAdapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/postgres/pool');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let postgresUserAdapter: typeof import('@/lib/db/auth/postgresUserAdapter').postgresUserAdapter;
let query: ReturnType<typeof vi.fn>;

const DB_ROW = {
  id: 'u-1',
  username: 'admin',
  password_hash: 'a'.repeat(64),
  role: 'admin',
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  last_login_at: null,
};

beforeEach(async () => {
  vi.resetModules();
  const pool = await import('@/lib/db/postgres/pool');
  query = pool.query as ReturnType<typeof vi.fn>;

  const mod = await import('@/lib/db/auth/postgresUserAdapter');
  postgresUserAdapter = mod.postgresUserAdapter;
});

afterEach(() => vi.restoreAllMocks());

describe('postgresUserAdapter', () => {
  describe('findByUsername', () => {
    it('should return mapped user', async () => {
      query.mockResolvedValue({ rows: [DB_ROW] });
      const result = await postgresUserAdapter.findByUsername('admin');
      expect(result?.id).toBe('u-1');
      expect(result?.username).toBe('admin');
      expect(result?.passwordHash).toBe('a'.repeat(64));
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await postgresUserAdapter.findByUsername('ghost');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      query.mockRejectedValue(new Error('connection refused'));
      const result = await postgresUserAdapter.findByUsername('admin');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return mapped user', async () => {
      query.mockResolvedValue({ rows: [DB_ROW] });
      const result = await postgresUserAdapter.findById('u-1');
      expect(result?.username).toBe('admin');
    });

    it('should return null when not found', async () => {
      query.mockResolvedValue({ rows: [] });
      const result = await postgresUserAdapter.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should insert user record', async () => {
      query.mockResolvedValue({ rowCount: 1 });
      await postgresUserAdapter.create({
        id: 'u-2',
        username: 'editor1',
        passwordHash: 'b'.repeat(64),
        role: 'editor',
        createdAt: '2025-01-01T00:00:00.000Z',
      });
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO corrections_users'),
        expect.arrayContaining(['u-2', 'editor1']),
      );
    });
  });

  describe('update', () => {
    it('should update specified fields', async () => {
      query.mockResolvedValue({ rowCount: 1 });
      await postgresUserAdapter.update('u-1', {
        lastLoginAt: '2025-06-01T00:00:00.000Z',
      });
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE corrections_users'),
        expect.any(Array),
      );
    });

    it('should no-op when no fields provided', async () => {
      await postgresUserAdapter.update('u-1', {});
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('listAll', () => {
    it('should return mapped users', async () => {
      query.mockResolvedValue({ rows: [DB_ROW] });
      const result = await postgresUserAdapter.listAll();
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('admin');
    });

    it('should return empty array on error', async () => {
      query.mockRejectedValue(new Error('fail'));
      const result = await postgresUserAdapter.listAll();
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      query.mockResolvedValue({ rowCount: 1 });
      await postgresUserAdapter.delete('u-1');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM corrections_users'),
        ['u-1'],
      );
    });

    it('should throw if user not found', async () => {
      query.mockResolvedValue({ rowCount: 0 });
      await expect(postgresUserAdapter.delete('ghost')).rejects.toThrow(
        'User not found',
      );
    });
  });
});
