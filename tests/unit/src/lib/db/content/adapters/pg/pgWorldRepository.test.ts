/**
 * pgWorldRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL world repository.
 * Verifies row-mapping from `WorldEntity` rows to `WorldMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgWorldRepository
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEM = {
  find: vi.fn(),
  findOne: vi.fn(),
};

vi.mock('@/lib/db/orm/orm', () => ({
  getEM: vi.fn().mockResolvedValue(mockEM),
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

let pgWorldRepository: typeof import('@/lib/db/content/adapters/pg/pgWorldRepository').pgWorldRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgWorldRepository');
  pgWorldRepository = mod.pgWorldRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM WorldEntity row. */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'ordovica',
  title: 'Ordovica',
  file: 'src/content/en/world/ordovica.mdx',
  link: '/library/world/ordovica',
  category: 'nation',
  aliases: ['The Grey Reach'],
  relatedSlugs: [],
  knowledgeTiers: ['Common'],
  tags: ['nation'],
  produces: ['kw--ordovica'],
  consumes: [],
  consumers: [],
  description: 'A nation.',
  readingTime: '4 min read',
  versionHash: 'h_abc',
};

describe('pgWorldRepository', () => {
  describe('list', () => {
    it('should map rows to world metadata', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const [entry] = await pgWorldRepository.list('en');

      expect(entry.slug).toBe('ordovica');
      expect(entry.category).toBe('nation');
      expect(entry.produces).toEqual(['kw--ordovica']);
      expect(entry.readingTime).toBe('4 min read');
    });

    it('should leave an empty array undefined rather than empty', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const [entry] = await pgWorldRepository.list('en');

      expect(entry.consumes).toBeUndefined();
    });

    it('should return an empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('down'));

      expect(await pgWorldRepository.list('en')).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should map a single row', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const entry = await pgWorldRepository.getBySlug('en', 'ordovica');

      expect(entry?.title).toBe('Ordovica');
    });

    it('should return null when absent', async () => {
      mockEM.findOne.mockResolvedValue(null);

      expect(await pgWorldRepository.getBySlug('en', 'missing')).toBeNull();
    });
  });
});
