/**
 * Character Storage Utilities Unit Tests
 *
 * @fileoverview Tests for pure helper functions in characterStorage.
 * Covers proficiency bonus math, ability modifier math, and the createEmptyCharacter factory.
 */

import {
    SKILL_DEFAULTS,
    SPELL_SLOT_DEFAULTS,
    computeAbilityModifier,
    computeProficiencyBonus,
    createEmptyCharacter,
} from '@/lib/utils/characterStorage';
import { describe, expect, it } from 'vitest';

describe('computeProficiencyBonus', () => {
  it('should return 2 for levels 1-4', () => {
    expect(computeProficiencyBonus(1)).toBe(2);
    expect(computeProficiencyBonus(4)).toBe(2);
  });

  it('should return 3 for levels 5-8', () => {
    expect(computeProficiencyBonus(5)).toBe(3);
    expect(computeProficiencyBonus(8)).toBe(3);
  });

  it('should return 4 for levels 9-12', () => {
    expect(computeProficiencyBonus(9)).toBe(4);
    expect(computeProficiencyBonus(12)).toBe(4);
  });

  it('should return 6 for level 20', () => {
    expect(computeProficiencyBonus(20)).toBe(6);
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

  it('should produce a character with all 28 skills at none proficiency', () => {
    const ch = createEmptyCharacter();
    expect(ch.skills).toHaveLength(28);
    ch.skills.forEach((s) => expect(s.proficiency).toBe('none'));
  });
});

describe('SKILL_DEFAULTS', () => {
  it('should contain 28 skills', () => {
    expect(SKILL_DEFAULTS).toHaveLength(28);
  });

  it('should have Perception linked to wis', () => {
    const perception = SKILL_DEFAULTS.find((s) => s.name === 'Perception');
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
