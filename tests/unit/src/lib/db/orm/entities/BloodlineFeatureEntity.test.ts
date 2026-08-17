/**
 * BloodlineFeatureEntity Unit Tests
 *
 * @fileoverview Tests for the BloodlineFeature MikroORM entity.
 * @module tests/unit/lib/db/orm/entities/BloodlineFeatureEntity
 */

import { BloodlineFeatureEntity } from '@/lib/db/orm/entities/BloodlineFeatureEntity';
import { describe, expect, it } from 'vitest';

describe('BloodlineFeatureEntity', () => {
  it('should be constructable with tags defaulting to an empty array', () => {
    const entity = new BloodlineFeatureEntity();
    expect(entity).toBeInstanceOf(BloodlineFeatureEntity);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new BloodlineFeatureEntity();
    entity.featureId = 'homunculus:living-flame';
    entity.name = 'Living Flame';
    entity.sortOrder = 1;
    entity.startLine = 36;
    entity.endLine = 50;
    entity.tags = ['resource:per-repose'];
    expect(entity.featureId).toBe('homunculus:living-flame');
    expect(entity.tags).toContain('resource:per-repose');
  });
});
