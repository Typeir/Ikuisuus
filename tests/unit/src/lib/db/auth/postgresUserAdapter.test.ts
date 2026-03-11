/**
 * PostgreSQL User Adapter Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL user adapter.
 * Mocks `@/lib/db/orm/orm` (getEM) to avoid real DB connections.
 *
 * @module tests/unit/lib/db/auth/postgresUserAdapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

const mockEm = {
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  flush: vi.fn(),
  findOneOrFail: vi.fn(),
  removeAndFlush: vi.fn(),
};

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue(mockEm),
}));

/**
 * Production row shape as returned by MikroORM after entity mapping.
 * `password_hash` column maps to `passwordHash` via the `@Property({ fieldName })` decorator.
 *
 * @type {object}
 */
const REAL_DB_ROW = {
  id: '09ff29d0-2f9e-40d2-88f6-013a92990d16',
  username: 'admin',
  passwordHash: 'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
  role: 'admin',
  createdAt: new Date('2026-03-08T22:56:09.688487Z'),
  lastLoginAt: null,
};

let postgresUserAdapter: typeof import('@/lib/db/auth/postgresUserAdapter').postgresUserAdapter;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mockEm.findOne.mockReset();
  mockEm.find.mockReset();
  mockEm.create.mockReset();
  mockEm.flush.mockReset();
  mockEm.findOneOrFail.mockReset();
  mockEm.removeAndFlush.mockReset();

  const mod = await import('@/lib/db/auth/postgresUserAdapter');
  postgresUserAdapter = mod.postgresUserAdapter;
});

afterEach(() => vi.restoreAllMocks());

describe('postgresUserAdapter', () => {
  describe('findByUsername', () => {
    it('should return mapped user matching real production row', async () => {
      mockEm.findOne.mockResolvedValue(REAL_DB_ROW);

      const result = await postgresUserAdapter.findByUsername('admin');

      expect(result?.id).toBe('09ff29d0-2f9e-40d2-88f6-013a92990d16');
      expect(result?.username).toBe('admin');
      expect(result?.passwordHash).toBe(
        'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
      );
      expect(result?.role).toBe('admin');
    });

    it('should use case-insensitive lookup ($ilike)', async () => {
      mockEm.findOne.mockResolvedValue(REAL_DB_ROW);

      await postgresUserAdapter.findByUsername('ADMIN');

      expect(mockEm.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { username: { $ilike: 'ADMIN' } },
      );
    });

    it('should return null when not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      const result = await postgresUserAdapter.findByUsername('ghost');
      expect(result).toBeNull();
    });

    it('should return null on DB error', async () => {
      mockEm.findOne.mockRejectedValue(new Error('connection refused'));
      const result = await postgresUserAdapter.findByUsername('admin');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return mapped user', async () => {
      mockEm.findOne.mockResolvedValue(REAL_DB_ROW);

      const result = await postgresUserAdapter.findById(
        '09ff29d0-2f9e-40d2-88f6-013a92990d16',
      );

      expect(result?.username).toBe('admin');
      expect(result?.id).toBe('09ff29d0-2f9e-40d2-88f6-013a92990d16');
    });

    it('should return null when not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      const result = await postgresUserAdapter.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and flush a new user entity', async () => {
      mockEm.create.mockReturnValue({});
      mockEm.flush.mockResolvedValue(undefined);

      await postgresUserAdapter.create({
        id: 'u-2',
        username: 'editor1',
        passwordHash: 'b'.repeat(64),
        role: 'editor',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      expect(mockEm.create).toHaveBeenCalledOnce();
      expect(mockEm.flush).toHaveBeenCalledOnce();
    });
  });

  describe('update', () => {
    it('should merge lastLoginAt and flush', async () => {
      const row = { ...REAL_DB_ROW };
      mockEm.findOneOrFail.mockResolvedValue(row);
      mockEm.flush.mockResolvedValue(undefined);

      await postgresUserAdapter.update(
        '09ff29d0-2f9e-40d2-88f6-013a92990d16',
        { lastLoginAt: '2026-03-11T00:00:00.000Z' },
      );

      expect(row.lastLoginAt).toEqual(new Date('2026-03-11T00:00:00.000Z'));
      expect(mockEm.flush).toHaveBeenCalledOnce();
    });
  });

  describe('listAll', () => {
    it('should return all mapped users', async () => {
      mockEm.find.mockResolvedValue([REAL_DB_ROW]);

      const result = await postgresUserAdapter.listAll();

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('admin');
      expect(result[0].passwordHash).toBe(
        'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
      );
    });

    it('should return empty array on DB error', async () => {
      mockEm.find.mockRejectedValue(new Error('fail'));
      const result = await postgresUserAdapter.listAll();
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should remove user and flush', async () => {
      mockEm.findOne.mockResolvedValue(REAL_DB_ROW);
      mockEm.removeAndFlush.mockResolvedValue(undefined);

      await postgresUserAdapter.delete(
        '09ff29d0-2f9e-40d2-88f6-013a92990d16',
      );

      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(REAL_DB_ROW);
    });

    it('should throw if user not found', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        postgresUserAdapter.delete('09ff29d0-2f9e-40d2-88f6-013a92990d16'),
      ).rejects.toThrow('User not found');
    });
  });
});
