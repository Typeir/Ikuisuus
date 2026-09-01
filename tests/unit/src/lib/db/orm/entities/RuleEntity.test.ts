/**
 * RuleEntity Unit Tests
 *
 * @fileoverview Tests for the Rule MikroORM entity.
 *
 * @module tests/unit/src/lib/db/orm/entities/RuleEntity.test
 */

import { RuleEntity } from '@/lib/db/orm/entities/RuleEntity';
import { describe, expect, it } from 'vitest';

describe('RuleEntity', () => {
  it('should be constructable', () => {
    expect(new RuleEntity()).toBeInstanceOf(RuleEntity);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new RuleEntity();
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new RuleEntity();
    entity.locale = 'en';
    entity.slug = 'sample';
    entity.title = 'Sample';
    entity.file = 'src/content/en/rules/sample.mdx';
    entity.link = '/en/library/rules/sample';
    entity.category = 'core';
    entity.readingTime = '2 min read';
    entity.versionHash = 'abc123';

    expect(entity.slug).toBe('sample');
    expect(entity.category).toBe('core');
    expect(entity.readingTime).toBe('2 min read');
  });
});
