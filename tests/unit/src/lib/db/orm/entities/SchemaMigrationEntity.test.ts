/**
 * SchemaMigrationEntity Unit Tests
 *
 * @fileoverview Tests for the SchemaMigration MikroORM entity class.
 *
 * @module tests/unit/lib/db/orm/entities/SchemaMigrationEntity
 */

import { SchemaMigrationEntity } from '@/lib/db/orm/entities/SchemaMigrationEntity';
import { describe, expect, it } from 'vitest';

describe('SchemaMigrationEntity', () => {
  it('should be constructable', () => {
    const entity = new SchemaMigrationEntity();
    expect(entity).toBeInstanceOf(SchemaMigrationEntity);
  });

  it('should accept field assignments', () => {
    const entity = new SchemaMigrationEntity();
    entity.name = '001_initial.sql';
    entity.appliedAt = new Date('2025-01-01T00:00:00Z');

    expect(entity.name).toBe('001_initial.sql');
    expect(entity.appliedAt).toEqual(new Date('2025-01-01T00:00:00Z'));
  });
});
