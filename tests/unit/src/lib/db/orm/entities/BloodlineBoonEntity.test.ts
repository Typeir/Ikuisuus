/**
 * BloodlineBoonEntity Unit Tests
 *
 * @fileoverview Tests for the BloodlineBoon MikroORM entity.
 *
 * @module tests/unit/src/lib/db/orm/entities/BloodlineBoonEntity.test
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { BloodlineBoonEntity } from '@/lib/db/orm/entities/BloodlineBoonEntity';
import { describe, expect, it } from 'vitest';

describe('BloodlineBoonEntity', () => {
  it('should be constructable', () => {
    const entity = new BloodlineBoonEntity();
    expect(entity).toBeInstanceOf(BloodlineBoonEntity);
  });

  it('should accept scalar field assignments', () => {
    const entity = new BloodlineBoonEntity();
    entity.name = 'Extended Reach';
    entity.bpLabel = '6 BP';
    entity.bpValue = 6;
    entity.sortOrder = 0;
    entity.tags = ['mechanic:weapon-reach', 'mechanic:weapon'];

    expect(entity.name).toBe('Extended Reach');
    expect(entity.bpValue).toBe(6);
    expect(entity.sortOrder).toBe(0);
    expect(entity.tags).toContain('mechanic:weapon-reach');
  });

  it('should allow nullable bpValue and default tags array', () => {
    const entity = new BloodlineBoonEntity();
    entity.bpValue = null;

    expect(entity.bpValue).toBeNull();
    expect(entity.tags).toEqual([]);
  });
});
