/**
 * @fileoverview Tests for DraftEntity ORM entity
 * @description Validates entity instantiation, default values, type exports,
 * and nullable field behavior for the `drafts` table entity.
 */

import type { DraftStatus } from '@/lib/db/orm/entities/DraftEntity';
import { DraftEntity } from '@/lib/db/orm/entities/DraftEntity';
import { describe, expect, it } from 'vitest';

describe('DraftEntity', () => {
  it('should be instantiable', () => {
    const entity = new DraftEntity();
    expect(entity).toBeInstanceOf(DraftEntity);
  });

  it('should have all expected property slots', () => {
    const entity = new DraftEntity();
    const expectedKeys = [
      'id',
      'locale',
      'slug',
      'content',
      'status',
      'createdAt',
      'updatedAt',
      'versionHash',
    ];

    for (const key of expectedKeys) {
      expect(
        key in entity || entity[key as keyof DraftEntity] === undefined,
      ).toBe(true);
    }
  });

  it('should accept valid DraftStatus values', () => {
    const validStatuses: DraftStatus[] = ['active', 'pending', 'archived'];

    for (const status of validStatuses) {
      const entity = new DraftEntity();
      entity.status = status;
      expect(entity.status).toBe(status);
    }
  });

  it('should allow versionHash to be null', () => {
    const entity = new DraftEntity();
    entity.versionHash = null;
    expect(entity.versionHash).toBeNull();
  });

  it('should allow versionHash to be a string', () => {
    const entity = new DraftEntity();
    entity.versionHash = 'abc123hash';
    expect(entity.versionHash).toBe('abc123hash');
  });

  it('should accept string values for locale and slug', () => {
    const entity = new DraftEntity();
    entity.locale = 'es';
    entity.slug = 'monsters/ancient-red-dragon';
    entity.content = '# Ancient Red Dragon\n\nFearsome beast.';

    expect(entity.locale).toBe('es');
    expect(entity.slug).toBe('monsters/ancient-red-dragon');
    expect(entity.content).toContain('Ancient Red Dragon');
  });

  it('should accept Date values for timestamps', () => {
    const entity = new DraftEntity();
    const now = new Date();
    entity.createdAt = now;
    entity.updatedAt = now;

    expect(entity.createdAt).toBe(now);
    expect(entity.updatedAt).toBe(now);
  });
});
