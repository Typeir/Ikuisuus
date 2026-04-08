/**
 * BloodlineEntity Unit Tests
 *
 * @fileoverview Tests for the Bloodline MikroORM entity.
 *
 * @module tests/unit/lib/db/orm/entities/BloodlineEntity
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { BloodlineEntity } from '@/lib/db/orm/entities/BloodlineEntity';
import { describe, expect, it } from 'vitest';

describe('BloodlineEntity', () => {
  it('should be constructable', () => {
    const entity = new BloodlineEntity();
    expect(entity).toBeInstanceOf(BloodlineEntity);
  });

  it('should initialise array fields as empty arrays', () => {
    const entity = new BloodlineEntity();
    expect(entity.abilityScores).toEqual([]);
    expect(entity.movementSpeeds).toEqual([]);
    expect(entity.senses).toEqual([]);
    expect(entity.size).toEqual([]);
    expect(entity.creatureTypes).toEqual([]);
    expect(entity.tags).toEqual([]);
  });

  it('should accept scalar field assignments', () => {
    const entity = new BloodlineEntity();
    entity.locale = 'en';
    entity.slug = 'empyrean';
    entity.title = 'Empyrean';
    entity.file = 'empyrean.mdx';
    entity.link = '/library/character-creation/bloodlines/empyrean';
    entity.boonBudget = 10;

    expect(entity.slug).toBe('empyrean');
    expect(entity.boonBudget).toBe(10);
  });

  it('should accept nullable fields', () => {
    const entity = new BloodlineEntity();
    entity.description = 'Lore text';
    entity.age = 'Centuries';
    entity.indexVersion = 1;
    entity.versionHash = 'abc123';

    expect(entity.description).toBe('Lore text');
    expect(entity.age).toBe('Centuries');
  });
});
