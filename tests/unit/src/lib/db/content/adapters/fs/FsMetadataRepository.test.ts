/**
 * FsMetadataRepository Unit Tests
 *
 * @fileoverview Tests for the abstract filesystem metadata repository base class.
 *
 * @module tests/unit/lib/db/content/adapters/fs/FsMetadataRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/content/adapters/fs/readMetadataFiles');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn() }),
  },
}));

type TestRecord = { slug: string; name: string };

let FsMetadataRepository: typeof import('@/lib/db/content/adapters/fs/FsMetadataRepository').FsMetadataRepository;
let readMetadataFiles: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  const rmf = await import('@/lib/db/content/adapters/fs/readMetadataFiles');
  readMetadataFiles = rmf.readMetadataFiles as ReturnType<typeof vi.fn>;
  const mod = await import('@/lib/db/content/adapters/fs/FsMetadataRepository');
  FsMetadataRepository = mod.FsMetadataRepository;
});

afterEach(() => vi.restoreAllMocks());

/** Minimal concrete subclass — no overrides. */
class TestRepo extends FsMetadataRepository<TestRecord> {
  constructor() {
    super('things', 'TestRepo');
  }
}

/** Subclass with custom filter (only slug starting with 'a'). */
class FilteredRepo extends FsMetadataRepository<TestRecord> {
  constructor() {
    super('things', 'FilteredRepo');
  }
  protected override filter(r: unknown): r is TestRecord {
    return (
      r != null &&
      typeof r === 'object' &&
      (r as TestRecord).slug.startsWith('a')
    );
  }
}

/** Subclass with custom matchSlug (also checks a secondary field). */
class AliasRepo extends FsMetadataRepository<TestRecord & { alias?: string }> {
  constructor() {
    super('things', 'AliasRepo');
  }
  protected override matchSlug(
    r: TestRecord & { alias?: string },
    slug: string,
  ): boolean {
    return r.alias === slug || r.slug === slug;
  }
}

const RECORDS: TestRecord[] = [
  { slug: 'alpha', name: 'Alpha' },
  { slug: 'beta', name: 'Beta' },
];

describe('FsMetadataRepository', () => {
  describe('list (default filter)', () => {
    it('returns all non-null records', async () => {
      readMetadataFiles.mockResolvedValue([...RECORDS, null]);
      const repo = new TestRepo();
      expect(await repo.list('en')).toEqual(RECORDS);
    });

    it('returns empty array on error', async () => {
      readMetadataFiles.mockRejectedValue(new Error('disk fail'));
      expect(await new TestRepo().list('en')).toEqual([]);
    });
  });

  describe('list (custom filter)', () => {
    it('applies subclass filter', async () => {
      readMetadataFiles.mockResolvedValue(RECORDS);
      const result = await new FilteredRepo().list('en');
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('alpha');
    });
  });

  describe('getBySlug (default matchSlug)', () => {
    it('finds a record by slug', async () => {
      readMetadataFiles.mockResolvedValue(RECORDS);
      expect((await new TestRepo().getBySlug('en', 'beta'))?.name).toBe('Beta');
    });

    it('returns null when not found', async () => {
      readMetadataFiles.mockResolvedValue(RECORDS);
      expect(await new TestRepo().getBySlug('en', 'missing')).toBeNull();
    });

    it('returns null on error', async () => {
      readMetadataFiles.mockRejectedValue(new Error('disk fail'));
      expect(await new TestRepo().getBySlug('en', 'alpha')).toBeNull();
    });
  });

  describe('getBySlug (custom matchSlug)', () => {
    it('matches via alias field', async () => {
      readMetadataFiles.mockResolvedValue([
        { slug: 'main', alias: 'variant', name: 'Thing' },
      ]);
      const repo = new AliasRepo();
      expect(await repo.getBySlug('en', 'variant')).not.toBeNull();
      expect(await repo.getBySlug('en', 'main')).not.toBeNull();
    });
  });
});
