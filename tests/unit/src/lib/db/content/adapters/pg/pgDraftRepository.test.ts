/**
 * pgDraftRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL draft repository.
 * Verifies upsert, findActive, and archive operations including
 * row-mapping from DraftEntity to DraftMetadata domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgDraftRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEM = {
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  flush: vi.fn(),
};

const mockContentHash = vi.fn();

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue(mockEM),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      message: vi.fn(),
      warning: vi.fn(),
    }),
  },
}));
vi.mock('@/lib/metadata/contentHash', () => ({
  contentHash: (...args: unknown[]) => mockContentHash(...args),
}));

let pgDraftRepository: typeof import('@/lib/db/content/adapters/pg/pgDraftRepository').pgDraftRepository;

beforeEach(async () => {
  vi.resetModules();

  mockContentHash.mockReturnValue('abc12345');
  vi.doMock('@/lib/metadata/contentHash', () => ({
    contentHash: (...args: unknown[]) => mockContentHash(...args),
  }));
  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgDraftRepository');
  pgDraftRepository = mod.pgDraftRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.findOne.mockReset();
  mockEM.create.mockReset();
  mockEM.flush.mockReset();
  mockContentHash.mockReset();
});

/** @property {Date} fixedDate - Fixed date for deterministic tests */
const fixedDate = new Date('2026-03-12T12:00:00.000Z');

/** @property {object} existingRow - Mock DraftEntity row from DB */
const existingRow = {
  id: 42,
  locale: 'en',
  slug: 'monsters/albedo',
  content: '# Albedo\n\nOld content.',
  status: 'active' as const,
  createdAt: new Date('2026-03-12T00:00:00.000Z'),
  updatedAt: new Date('2026-03-12T01:00:00.000Z'),
  versionHash: null,
};

describe('pgDraftRepository', () => {
  describe('upsert', () => {
    it('should update existing active draft when one exists', async () => {
      const mutableRow = { ...existingRow };
      mockEM.findOne.mockResolvedValue(mutableRow);
      mockEM.flush.mockResolvedValue(undefined);

      const result = await pgDraftRepository.upsert({
        locale: 'en',
        slug: 'monsters/albedo',
        content: '# Albedo\n\nNew content.',
      });

      expect(mockEM.findOne).toHaveBeenCalledWith(expect.anything(), {
        locale: 'en',
        slug: 'monsters/albedo',
        status: 'active',
      });
      expect(result.id).toBe(42);
      expect(result.status).toBe('active');
      expect(result.locale).toBe('en');
      expect(result.slug).toBe('monsters/albedo');
      expect(result.versionHash).toBe('abc12345');
      expect(mutableRow.versionHash).toBe('abc12345');
      expect(mockEM.flush).toHaveBeenCalled();
    });

    it('should create a new draft when none exists', async () => {
      mockEM.findOne.mockResolvedValue(null);

      const newRow = {
        id: 43,
        locale: 'en',
        slug: 'spells/fireball',
        content: '# Fireball',
        status: 'active',
        versionHash: 'abc12345',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockEM.create.mockReturnValue(newRow);
      mockEM.flush.mockResolvedValue(undefined);

      const result = await pgDraftRepository.upsert({
        locale: 'en',
        slug: 'spells/fireball',
        content: '# Fireball',
      });

      expect(mockEM.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ versionHash: 'abc12345', status: 'active' }),
      );
      expect(result.id).toBe(43);
      expect(result.slug).toBe('spells/fireball');
      expect(result.status).toBe('active');
      expect(result.versionHash).toBe('abc12345');
    });

    it('should create a pending draft when status is pending', async () => {
      mockEM.findOne.mockResolvedValue(null);

      const pendingRow = {
        id: 44,
        locale: 'en',
        slug: 'spells/icebolt',
        content: '# Icebolt',
        status: 'pending',
        versionHash: 'abc12345',
        createdAt: fixedDate,
        updatedAt: fixedDate,
      };
      mockEM.create.mockReturnValue(pendingRow);
      mockEM.flush.mockResolvedValue(undefined);

      const result = await pgDraftRepository.upsert({
        locale: 'en',
        slug: 'spells/icebolt',
        content: '# Icebolt',
        status: 'pending',
      });

      expect(mockEM.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'pending' }),
      );
      expect(result.status).toBe('pending');
    });

    it('should throw on database error', async () => {
      mockEM.findOne.mockRejectedValue(new Error('Connection refused'));

      await expect(
        pgDraftRepository.upsert({
          locale: 'en',
          slug: 'test',
          content: 'content',
        }),
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('findActive', () => {
    it('should return mapped DraftMetadata when active draft exists', async () => {
      mockEM.findOne.mockResolvedValue({ ...existingRow });

      const result = await pgDraftRepository.findActive(
        'en',
        'monsters/albedo',
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(42);
      expect(result!.locale).toBe('en');
      expect(result!.slug).toBe('monsters/albedo');
      expect(result!.status).toBe('active');
      expect(result!.createdAt).toBe('2026-03-12T00:00:00.000Z');
      expect(result!.updatedAt).toBe('2026-03-12T01:00:00.000Z');
    });

    it('should return null when no active draft exists', async () => {
      mockEM.findOne.mockResolvedValue(null);

      const result = await pgDraftRepository.findActive('en', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error (graceful degradation)', async () => {
      mockEM.findOne.mockRejectedValue(new Error('Timeout'));

      const result = await pgDraftRepository.findActive('en', 'test');

      expect(result).toBeNull();
    });
  });

  describe('archive', () => {
    it('should set status to archived and return true', async () => {
      const row = { ...existingRow };
      mockEM.findOne.mockResolvedValue(row);
      mockEM.flush.mockResolvedValue(undefined);

      const result = await pgDraftRepository.archive('en', 'monsters/albedo');

      expect(result).toBe(true);
      expect(row.status).toBe('archived');
      expect(mockEM.flush).toHaveBeenCalled();
    });

    it('should return false when no active draft exists', async () => {
      mockEM.findOne.mockResolvedValue(null);

      const result = await pgDraftRepository.archive('en', 'nonexistent');

      expect(result).toBe(false);
      expect(mockEM.flush).not.toHaveBeenCalled();
    });

    it('should throw on database error', async () => {
      mockEM.findOne.mockResolvedValue({ ...existingRow });
      mockEM.flush.mockRejectedValue(new Error('Deadlock'));

      await expect(pgDraftRepository.archive('en', 'test')).rejects.toThrow(
        'Deadlock',
      );
    });
  });
});
