/**
 * @fileoverview Proficiency calculation utilities
 * @description Shared logic for computing bonuses from proficiency levels
 *
 * @module modules/character-builder/lib/utils/proficiencyUtils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSkill, CharacterTool, TierLevel } from '@/lib/types/character';
import { computeAbilityModifier } from './characterStorage';

/**
 * Compute bonus for tool proficiency (no ability modifier).
 *
 * @param {TierLevel} proficiency - Current proficiency level
 * @param {number} tierBonus - tier bonus from character level
 * @returns {number} - Total bonus
 */
export const computeToolBonus = (tier: TierLevel, tierBonus: number): number => {
  if (tier === 'savanthood') return tierBonus * 3;
  if (tier === 'expertise') return tierBonus * 2;
  if (tier === 'proficient') return tierBonus;
  if (tier === 'familiarity') return Math.floor(tierBonus / 2);
  return 0;
};

/**
 * Compute bonus for skill proficiency (includes ability modifier).
 *
 * @param {CharacterSkill} skill - Skill with proficiency and ability
 * @param {Record<string, number>} abilityScores - Map of ability key → raw score
 * @param {number} tierBonus - tier bonus from character level
 * @returns {number} - Total bonus (ability modifier + proficiency)
 */
export const computeSkillBonus = (
  skill: CharacterSkill,
  abilityScores: Record<string, number>,
  tierBonus: number,
): number => {
  const abilityMod = computeAbilityModifier(abilityScores[skill.ability] ?? 10);
  if (skill.tier === 'savanthood') return abilityMod + tierBonus * 3;
  if (skill.tier === 'expertise') return abilityMod + tierBonus * 2;
  if (skill.tier === 'proficient') return abilityMod + tierBonus;
  if (skill.tier === 'familiarity') return abilityMod + Math.floor(tierBonus / 2);
  return abilityMod;
};

/**
 * Update item proficiency in an array by index.
 *
 * @template T - Item type (CharacterSkill or CharacterTool)
 * @param {T[]} items - Array of items
 * @param {number} index - Index to update
 * @param {TierLevel} newTier - New proficiency level
 * @returns {T[]} - Updated array
 */
export const updateItemTier = <T extends CharacterSkill | CharacterTool>(
  items: T[],
  index: number,
  newTier: TierLevel,
): T[] =>
  items.map((item, i) =>
    i === index ? { ...item, tier: newTier } : item,
  );
