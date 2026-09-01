/**
 * BloodlineBoonOptionEntity Unit Tests
 *
 * @fileoverview Tests for the BloodlineBoonOption MikroORM entity.
 * @module tests/unit/src/lib/db/orm/entities/BloodlineBoonOptionEntity.test
 */

import { BloodlineBoonOptionEntity } from '@/lib/db/orm/entities/BloodlineBoonOptionEntity';
import { describe, expect, it } from 'vitest';

describe('BloodlineBoonOptionEntity', () => {
  it('should be constructable with tags defaulting to an empty array', () => {
    const entity = new BloodlineBoonOptionEntity();
    expect(entity).toBeInstanceOf(BloodlineBoonOptionEntity);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new BloodlineBoonOptionEntity();
    entity.name = 'Urban Explorer';
    entity.anchor = 'urban-explorer';
    entity.bpValue = 5;
    entity.effect = 'Perception proficiency';
    entity.tags = ['proficiency:perception'];
    entity.sortOrder = 0;
    expect(entity.anchor).toBe('urban-explorer');
    expect(entity.bpValue).toBe(5);
  });
});
