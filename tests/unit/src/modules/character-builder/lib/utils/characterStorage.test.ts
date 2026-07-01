/**
 * Character Storage Utilities Unit Tests
 *
 * @fileoverview Tests for pure helper functions in characterStorage.
 * Covers tier bonus math, ability modifier math, and the createEmptyCharacter factory.
 */

import {
    SKILL_DEFAULTS,
    SPELL_SLOT_DEFAULTS,
    computeAbilityModifier,
    computeTierBonus,
    createEmptyCharacter,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { describe, expect, it } from 'vitest';

describe('computeTierBonus', () => {
  it('should return 1 for levels 1-3', () => {
    expect(computeTierBonus(1)).toBe(1);
    expect(computeTierBonus(3)).toBe(1);
  });

  it('should return 2 for levels 4-6', () => {
    expect(computeTierBonus(4)).toBe(2);
    expect(computeTierBonus(6)).toBe(2);
  });

  it('should return 3 for levels 7-9', () => {
    expect(computeTierBonus(7)).toBe(3);
    expect(computeTierBonus(9)).toBe(3);
  });

  it('should return 7 for level 20', () => {
    expect(computeTierBonus(20)).toBe(7);
  });
});

describe('computeAbilityModifier', () => {
  it('should return -5 for score 1', () => {
    expect(computeAbilityModifier(1)).toBe(-5);
  });

  it('should return 0 for score 10 or 11', () => {
    expect(computeAbilityModifier(10)).toBe(0);
    expect(computeAbilityModifier(11)).toBe(0);
  });

  it('should return +5 for score 20', () => {
    expect(computeAbilityModifier(20)).toBe(5);
  });

  it('should return +10 for score 30', () => {
    expect(computeAbilityModifier(30)).toBe(10);
  });
});

describe('createEmptyCharacter', () => {
  it('should produce a character with default ability scores of 10', () => {
    const ch = createEmptyCharacter();
    expect(ch.abilityScores.str).toBe(10);
    expect(ch.abilityScores.dex).toBe(10);
    expect(ch.abilityScores.con).toBe(10);
    expect(ch.abilityScores.int).toBe(10);
    expect(ch.abilityScores.wis).toBe(10);
    expect(ch.abilityScores.cha).toBe(10);
  });

  it('should produce a character with level 1 and empty name', () => {
    const ch = createEmptyCharacter();
    expect(ch.level).toBe(1);
    expect(ch.name).toBe('');
  });

  it('should produce a character with all saving throws set to none', () => {
    const ch = createEmptyCharacter();
    expect(ch.savingThrows.str).toBe('none');
    expect(ch.savingThrows.cha).toBe('none');
  });

  it('should produce a character with 9 spell slot levels', () => {
    const ch = createEmptyCharacter();
    expect(ch.spellSlots).toHaveLength(9);
    expect(ch.spellSlots[0].level).toBe(1);
    expect(ch.spellSlots[8].level).toBe(9);
  });

  it('should produce unique IDs for each call', () => {
    const a = createEmptyCharacter();
    const b = createEmptyCharacter();
    expect(a.id).not.toBe(b.id);
  });

  it('should produce a character with all 19 skills at none proficiency', () => {
    const ch = createEmptyCharacter();
    expect(ch.skills).toHaveLength(19);
    ch.skills.forEach((s) => expect(s.tier).toBe('none'));
  });
});

describe('SKILL_DEFAULTS', () => {
  it('should contain 19 skills', () => {
    expect(SKILL_DEFAULTS).toHaveLength(19);
  });

  it('should have Perception linked to wis', () => {
    const perception = SKILL_DEFAULTS.find(
      (s) => s.name === 'skills.perception',
    );
    expect(perception?.ability).toBe('wis');
  });
});

describe('SPELL_SLOT_DEFAULTS', () => {
  it('should contain 9 slot levels', () => {
    expect(SPELL_SLOT_DEFAULTS).toHaveLength(9);
  });

  it('should have all slots at total 0 and used 0', () => {
    SPELL_SLOT_DEFAULTS.forEach((slot) => {
      expect(slot.total).toBe(0);
      expect(slot.used).toBe(0);
    });
  });
});
