/**
 * @fileoverview Proficiency calculation utilities
 */

import type {
    CharacterSkill,
    CharacterTool,
    ProficiencyLevel,
} from '@/lib/types/character';
import { computeAbilityModifier } from './characterStorage';

/**
 * Compute bonus for tool proficiency (no ability modifier).
 */
export const computeToolBonus = (
  proficiency: ProficiencyLevel,
  proficiencyBonus: number,
): number => {
  if (proficiency === 'savanthood') return proficiencyBonus * 3;
  if (proficiency === 'expertise') return proficiencyBonus * 2;
  if (proficiency === 'proficient') return proficiencyBonus;
  if (proficiency === 'familiarity') return Math.floor(proficiencyBonus / 2);
  return 0;
};

/**
 * Compute bonus for skill proficiency (includes ability modifier).
 */
export const computeSkillBonus = (
  skill: CharacterSkill,
  abilityScores: Record<string, number>,
  proficiencyBonus: number,
): number => {
  const abilityMod = computeAbilityModifier(abilityScores[skill.ability] ?? 10);
  if (skill.proficiency === 'savanthood')
    return abilityMod + proficiencyBonus * 3;
  if (skill.proficiency === 'expertise')
    return abilityMod + proficiencyBonus * 2;
  if (skill.proficiency === 'proficient') return abilityMod + proficiencyBonus;
  if (skill.proficiency === 'familiarity')
    return abilityMod + Math.floor(proficiencyBonus / 2);
  return abilityMod;
};

/**
 * Update item proficiency in an array by index.
 */
export const updateItemProficiency = <T extends CharacterSkill | CharacterTool>(
  items: T[],
  index: number,
  newProficiency: ProficiencyLevel,
): T[] =>
  items.map((item, i) =>
    i === index ? { ...item, proficiency: newProficiency } : item,
  );
