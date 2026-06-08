/**
 * @fileoverview Tests for proficiency utilities
 * @module tests/unit/modules/character-builder/lib/utils/proficiencyUtils.test.ts
 */

import { describe, it, expect } from 'vitest';
import type { CharacterSkill, CharacterTool } from '@/lib/types/character';
import { computeToolBonus, computeSkillBonus, updateItemProficiency } from '@/modules/character-builder/lib/utils/proficiencyUtils';

describe('proficiencyUtils', () => {
  describe('computeToolBonus', () => {
    it('should return multiplied bonus for savanthood', () => {
      expect(computeToolBonus('savanthood', 2)).toBe(6);
    });

    it('should return multiplied bonus for expertise', () => {
      expect(computeToolBonus('expertise', 2)).toBe(4);
    });

    it('should return bonus for proficient', () => {
      expect(computeToolBonus('proficient', 2)).toBe(2);
    });

    it('should return half bonus for familiarity', () => {
      expect(computeToolBonus('familiarity', 5)).toBe(2);
    });

    it('should return 0 for none', () => {
      expect(computeToolBonus('none', 2)).toBe(0);
    });
  });

  describe('computeSkillBonus', () => {
    it('should add ability modifier to proficiency bonus', () => {
      const skill: CharacterSkill = { name: 'acrobatics', ability: 'dex', proficiency: 'proficient' };
      const abilityScores = { dex: 16 };
      const bonus = computeSkillBonus(skill, abilityScores, 2);
      expect(bonus).toBe(5);
    });

    it('should handle ability score of 10', () => {
      const skill: CharacterSkill = { name: 'athletics', ability: 'str', proficiency: 'proficient' };
      const abilityScores = { str: 10 };
      const bonus = computeSkillBonus(skill, abilityScores, 2);
      expect(bonus).toBe(2);
    });

    it('should use 10 for missing ability score', () => {
      const skill: CharacterSkill = { name: 'arcana', ability: 'int', proficiency: 'proficient' };
      const abilityScores = {};
      const bonus = computeSkillBonus(skill, abilityScores, 2);
      expect(bonus).toBe(2);
    });
  });

  describe('updateItemProficiency', () => {
    it('should update skill proficiency by index', () => {
      const skills: CharacterSkill[] = [
        { name: 'acrobatics', ability: 'dex', proficiency: 'none' },
        { name: 'athletics', ability: 'str', proficiency: 'none' },
      ];
      const updated = updateItemProficiency(skills, 0, 'proficient');
      expect(updated[0].proficiency).toBe('proficient');
      expect(updated[1].proficiency).toBe('none');
    });

    it('should update tool proficiency by index', () => {
      const tools: CharacterTool[] = [
        { name: 'tools.alchemist', proficiency: 'none' },
        { name: 'tools.brewer', proficiency: 'none' },
      ];
      const updated = updateItemProficiency(tools, 1, 'expertise');
      expect(updated[0].proficiency).toBe('none');
      expect(updated[1].proficiency).toBe('expertise');
    });
  });
});
