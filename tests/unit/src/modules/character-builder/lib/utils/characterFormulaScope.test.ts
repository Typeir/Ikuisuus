/**
 * @fileoverview Character Formula Scope Tests
 * @description Unit tests for the flat formula-substitution scope derived
 * from a character entity.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/characterFormulaScope
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { getCharacterFormulaScope } from '@/modules/character-builder/lib/utils/characterFormulaScope';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { describe, expect, it } from 'vitest';

describe('getCharacterFormulaScope', () => {
  it('exposes ability scores and modifiers under dot-notation keys', () => {
    const entity = {
      ...createEmptyCharacter(),
      abilityScores: { str: 16, dex: 8, con: 10, int: 13, wis: 11, cha: 20 },
    };
    const scope = getCharacterFormulaScope(entity);
    expect(scope['str']).toBe(16);
    expect(scope['str.mod']).toBe(3);
    expect(scope['dex.mod']).toBe(-1);
    expect(scope['cha.mod']).toBe(5);
    expect(scope['int.mod']).toBe(1);
  });

  it('exposes core combat and progression stats', () => {
    const entity = {
      ...createEmptyCharacter(),
      name: 'Testy',
      hpMax: 42,
      hpCurrent: 30,
      ac: 17,
      level: 7,
    };
    const scope = getCharacterFormulaScope(entity);
    expect(scope['name']).toBe('Testy');
    expect(scope['hpMax']).toBe(42);
    expect(scope['hpCurrent']).toBe(30);
    expect(scope['ac']).toBe(17);
    expect(scope['tierBonus']).toBe(3);
    expect(typeof scope['level']).toBe('number');
  });

  it('produces a flat plain-JSON map (primitives only)', () => {
    const scope = getCharacterFormulaScope(createEmptyCharacter());
    for (const value of Object.values(scope)) {
      expect(['string', 'number']).toContain(typeof value);
    }
  });
});
