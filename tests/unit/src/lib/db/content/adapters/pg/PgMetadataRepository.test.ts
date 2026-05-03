/**
 * PgMetadataRepository Unit Tests
 *
 * @fileoverview Tests for the abstract MikroORM metadata repository base class.
 * Exercises `list` and `getBySlug` via a concrete minimal subclass,
 * with `getEM` mocked so no real database is needed.
 *
 * @module tests/unit/lib/db/content/adapters/pg/PgMetadataRepository
 */

import type { EntityClass } from '@mikro-orm/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/orm/orm');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn() }),
  },
}));

type TestEntity = { locale: string; slug: string; name: string };
type TestMetadata = { slug: string; name: string };

/** Stub entity class — MikroORM only needs the constructor reference at runtime. */
class StubEntity {
  locale = '';
  slug = '';
  name = '';
}

const ROWS: TestEntity[] = [
  { locale: 'en', slug: 'alpha', name: 'Alpha' },
  { locale: 'en', slug: 'beta', name: 'Beta' },
];

const makeMockEM = (
  findResult: TestEntity[],
  findOneResult: TestEntity | null = null,
) => ({
  find: vi.fn().mockResolvedValue(findResult),
  findOne: vi.fn().mockResolvedValue(findOneResult),
});

let getEM: ReturnType<typeof vi.fn>;
let testRepo: {
  list(l: string): Promise<TestMetadata[]>;
  getBySlug(l: string, s: string): Promise<TestMetadata | null>;
};
let populatedRepo: {
  list(l: string): Promise<TestMetadata[]>;
  getBySlug(l: string, s: string): Promise<TestMetadata | null>;
};

beforeEach(async () => {
  vi.resetModules();
  const ormMod = await import('@/lib/db/orm/orm');
  getEM = ormMod.getEM as ReturnType<typeof vi.fn>;
  const { PgMetadataRepository } =
    await import('@/lib/db/content/adapters/pg/PgMetadataRepository');

  /** Minimal concrete subclass — no `populate` or `orderBy` overrides. */
  class TestRepoImpl extends PgMetadataRepository<TestEntity, TestMetadata> {
    protected readonly entityClass =
      StubEntity as unknown as EntityClass<TestEntity>;
    constructor() {
      super('TestPgRepo');
    }
    protected toMetadata(row: TestEntity): TestMetadata {
      return { slug: row.slug, name: row.name };
    }
  }

  /** Subclass with populate and orderBy overrides. */
  class PopulatedRepoImpl extends PgMetadataRepository<
    TestEntity,
    TestMetadata
  > {
    protected readonly entityClass =
      StubEntity as unknown as EntityClass<TestEntity>;
    constructor() {
      super('PopulatedPgRepo');
    }
    protected toMetadata(row: TestEntity): TestMetadata {
      return { slug: row.slug, name: row.name };
    }
    protected override populate(): string[] {
      return ['children'];
    }
    protected override orderBy(): Record<string, 'asc' | 'desc'> {
      return { name: 'asc' };
    }
  }

  testRepo = new TestRepoImpl();
  populatedRepo = new PopulatedRepoImpl();
});

afterEach(() => vi.restoreAllMocks());

describe('PgMetadataRepository', () => {
  describe('list', () => {
    it('returns mapped metadata for all rows', async () => {
      const mockEM = makeMockEM(ROWS);
      getEM.mockResolvedValue(mockEM);
      const result = await testRepo.list('en');
      expect(result).toEqual([
        { slug: 'alpha', name: 'Alpha' },
        { slug: 'beta', name: 'Beta' },
      ]);
      expect(mockEM.find).toHaveBeenCalledWith(
        StubEntity,
        { locale: 'en' },
        { populate: [] },
      );
    });

    it('passes populate and orderBy from overrides', async () => {
      const mockEM = makeMockEM(ROWS);
      getEM.mockResolvedValue(mockEM);
      await populatedRepo.list('en');
      expect(mockEM.find).toHaveBeenCalledWith(
        StubEntity,
        { locale: 'en' },
        { populate: ['children'], orderBy: { name: 'asc' } },
      );
    });

    it('returns empty array on error', async () => {
      getEM.mockRejectedValue(new Error('db offline'));
      expect(await testRepo.list('en')).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('returns mapped metadata when found', async () => {
      const mockEM = makeMockEM([], ROWS[0]);
      getEM.mockResolvedValue(mockEM);
      const result = await testRepo.getBySlug('en', 'alpha');
      expect(result).toEqual({ slug: 'alpha', name: 'Alpha' });
      expect(mockEM.findOne).toHaveBeenCalledWith(
        StubEntity,
        { locale: 'en', slug: 'alpha' },
        { populate: [] },
      );
    });

    it('returns null when row is not found', async () => {
      const mockEM = makeMockEM([], null);
      getEM.mockResolvedValue(mockEM);
      expect(await testRepo.getBySlug('en', 'missing')).toBeNull();
    });

    it('returns null on error', async () => {
      getEM.mockRejectedValue(new Error('db offline'));
      expect(await testRepo.getBySlug('en', 'alpha')).toBeNull();
    });

    it('passes populate from overrides', async () => {
      const mockEM = makeMockEM([], ROWS[1]);
      getEM.mockResolvedValue(mockEM);
      await populatedRepo.getBySlug('en', 'beta');
      expect(mockEM.findOne).toHaveBeenCalledWith(
        StubEntity,
        { locale: 'en', slug: 'beta' },
        { populate: ['children'] },
      );
    });
  });
});
