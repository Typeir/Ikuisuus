/**
 * WorldEntity Unit Tests
 *
 * @fileoverview Tests for the World MikroORM entity.
 *
 * @module tests/unit/src/lib/db/orm/entities/WorldEntity.test
 */

import { WorldEntity } from '@/lib/db/orm/entities/WorldEntity';
import { describe, expect, it } from 'vitest';

describe('WorldEntity', () => {
  it('should be constructable', () => {
    expect(new WorldEntity()).toBeInstanceOf(WorldEntity);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new WorldEntity();
    expect(entity.tags).toEqual([]);
    expect(entity.aliases).toEqual([]);
    expect(entity.relatedSlugs).toEqual([]);  });

  it('should accept scalar field assignments', () => {
    const entity = new WorldEntity();
    entity.locale = 'en';
    entity.slug = 'sample';
    entity.title = 'Sample';
    entity.file = 'src/content/en/world/sample.mdx';
    entity.link = '/en/library/world/sample';
    entity.category = 'core';
    entity.readingTime = '2 min read';
    entity.versionHash = 'abc123';

    expect(entity.slug).toBe('sample');
    expect(entity.category).toBe('core');
    expect(entity.readingTime).toBe('2 min read');
  });
});
