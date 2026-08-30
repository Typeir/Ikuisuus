/**
 * pgRuleRepository Unit Tests
 *
 * @fileoverview Tests for the MikroORM-backed PostgreSQL rule repository.
 * Verifies row-mapping from `RuleEntity` rows to `RuleMetadata` domain objects.
 *
 * @module tests/unit/lib/db/content/adapters/pg/pgRuleRepository
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

let pgRuleRepository: typeof import('@/lib/db/content/adapters/pg/pgRuleRepository').pgRuleRepository;

beforeEach(async () => {
  vi.resetModules();

  vi.doMock('@/lib/db/orm/orm', () => ({
    getEM: vi.fn().mockResolvedValue(mockEM),
  }));

  const mod = await import('@/lib/db/content/adapters/pg/pgRuleRepository');
  pgRuleRepository = mod.pgRuleRepository;
});

afterEach(() => {
  vi.restoreAllMocks();
  mockEM.find.mockReset();
  mockEM.findOne.mockReset();
});

/** MikroORM RuleEntity row. */
const entityRow = {
  id: 1,
  locale: 'en',
  slug: 'conditions',
  title: 'Conditions',
  file: 'src/content/en/rules/steel-and-strife/conditions.rule.mdx',
  link: '/library/rules/steel-and-strife/conditions',
  category: 'steel-and-strife',
  tags: ['combat'],
  produces: ['kw-condition-prone'],
  consumes: [],
  consumers: [],
  description: 'What can go wrong.',
  readingTime: '4 min read',
  versionHash: 'h_abc',
};

describe('pgRuleRepository', () => {
  describe('list', () => {
    it('should map rows to rule metadata', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const [rule] = await pgRuleRepository.list('en');

      expect(rule.slug).toBe('conditions');
      expect(rule.category).toBe('steel-and-strife');
      expect(rule.produces).toEqual(['kw-condition-prone']);
      expect(rule.readingTime).toBe('4 min read');
    });

    it('should leave an empty array undefined rather than empty', async () => {
      mockEM.find.mockResolvedValue([entityRow]);

      const [rule] = await pgRuleRepository.list('en');

      expect(rule.consumes).toBeUndefined();
    });

    it('should return an empty array on error', async () => {
      mockEM.find.mockRejectedValue(new Error('down'));

      expect(await pgRuleRepository.list('en')).toEqual([]);
    });
  });

  describe('getBySlug', () => {
    it('should map a single row', async () => {
      mockEM.findOne.mockResolvedValue(entityRow);

      const rule = await pgRuleRepository.getBySlug('en', 'conditions');

      expect(rule?.title).toBe('Conditions');
    });

    it('should return null when absent', async () => {
      mockEM.findOne.mockResolvedValue(null);

      expect(await pgRuleRepository.getBySlug('en', 'missing')).toBeNull();
    });
  });
});
