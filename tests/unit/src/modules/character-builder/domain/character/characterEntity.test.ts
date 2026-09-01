/**
 * @fileoverview Character Entity Domain Tests
 * @description Unit tests for the canonical single-JSON character entity:
 * serialization round-trips, deep cloning, and the structural guard.
 *
 * @module tests/unit/src/modules/character-builder/domain/character/characterEntity.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    cloneCharacterEntity,
    isCharacterEntity,
    serializeCharacterEntity,
} from '@/modules/character-builder/domain/character/characterEntity';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { describe, expect, it } from 'vitest';

describe('characterEntity', () => {
  it('round-trips losslessly through JSON', () => {
    const entity = createEmptyCharacter();
    const parsed = JSON.parse(serializeCharacterEntity(entity));
    expect(parsed).toEqual(entity);
  });

  it('cloneCharacterEntity returns a structurally independent copy', () => {
    const entity = createEmptyCharacter();
    const clone = cloneCharacterEntity(entity);
    expect(clone).toEqual(entity);
    expect(clone).not.toBe(entity);
    clone.abilityScores.str = 18;
    clone.skills[0].tier = 'proficient';
    expect(entity.abilityScores.str).toBe(10);
    expect(entity.skills[0].tier).toBe('none');
  });

  it('entity contains no self-references (JSON.stringify never throws)', () => {
    const entity = createEmptyCharacter();
    expect(() => JSON.stringify(entity)).not.toThrow();
  });

  it('isCharacterEntity accepts entity-shaped values', () => {
    expect(isCharacterEntity(createEmptyCharacter())).toBe(true);
  });

  it('isCharacterEntity rejects non-entities', () => {
    expect(isCharacterEntity(null)).toBe(false);
    expect(isCharacterEntity(undefined)).toBe(false);
    expect(isCharacterEntity('str')).toBe(false);
    expect(isCharacterEntity({ id: 1, name: 'x' })).toBe(false);
    expect(isCharacterEntity({ name: 'no-id' })).toBe(false);
  });
});
