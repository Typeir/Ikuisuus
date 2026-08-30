/**
 * pgKeywordLinkRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed keyword link adapter: it sweeps
 * every file-level table and keeps rows that define or ingest a shard.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgKeywordLinkRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEM = {
  find: vi.fn(),
};

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue(mockEM),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ warning: vi.fn(), error: vi.fn(), message: vi.fn() }),
  },
}));

let pgKeywordLinkRepository: typeof import('@/lib/db/content/adapters/pg/pgKeywordLinkRepository').pgKeywordLinkRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import(
    '@/lib/db/content/adapters/pg/pgKeywordLinkRepository'
  );
  pgKeywordLinkRepository = mod.pgKeywordLinkRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
});

/** Every file-level table carrying the shard columns. */
const TABLE_COUNT = 10;

/** Defines a shard. */
const PRODUCER = {
  file: 'src/content/en/rules/effects.rule.mdx',
  link: '/library/rules/effects',
  produces: ['kw--resist'],
  consumes: [],
};

describe('pgKeywordLinkRepository', () => {
  it('should query every file-level table', async () => {
    mockEM.find.mockResolvedValue([]);

    await pgKeywordLinkRepository.listLinks('en');

    expect(mockEM.find).toHaveBeenCalledTimes(TABLE_COUNT);
  });

  it('should scope each query to the locale', async () => {
    mockEM.find.mockResolvedValue([]);

    await pgKeywordLinkRepository.listLinks('es');

    expect(mockEM.find).toHaveBeenCalledWith(expect.anything(), {
      locale: 'es',
    });
  });

  it('should collect participating rows from every table', async () => {
    mockEM.find.mockResolvedValue([PRODUCER]);

    const links = await pgKeywordLinkRepository.listLinks('en');

    expect(links).toHaveLength(TABLE_COUNT);
    expect(links[0]).toEqual(PRODUCER);
  });

  it('should skip rows that neither produce nor consume', async () => {
    mockEM.find.mockResolvedValue([
      { file: 'a.mdx', link: '/a', produces: [], consumes: [] },
    ]);

    expect(await pgKeywordLinkRepository.listLinks('en')).toEqual([]);
  });

  it('should skip a row with no file path', async () => {
    mockEM.find.mockResolvedValue([{ link: '/a', produces: ['kw--a'] }]);

    expect(await pgKeywordLinkRepository.listLinks('en')).toEqual([]);
  });

  it('should tolerate null columns', async () => {
    mockEM.find.mockResolvedValue([
      { file: 'a.mdx', link: null, produces: ['kw--a'], consumes: null },
    ]);

    const links = await pgKeywordLinkRepository.listLinks('en');

    expect(links[0]).toEqual({
      file: 'a.mdx',
      link: '',
      produces: ['kw--a'],
      consumes: [],
    });
  });

  /* Invalidation is best effort: a page write must not fail because the graph
     was unreachable. */
  it('should return an empty array when the database is down', async () => {
    mockEM.find.mockRejectedValue(new Error('down'));

    expect(await pgKeywordLinkRepository.listLinks('en')).toEqual([]);
  });
});
