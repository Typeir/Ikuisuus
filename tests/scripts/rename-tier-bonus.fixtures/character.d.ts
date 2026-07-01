/**
 * @fileoverview Character Sheet Types
 */


/**
 * Proficiency level for saves and skills.
 *
 * @typedef {'none'|'familiarity'|'proficient'|'expertise'|'savanthood'} ProficiencyLevel
 */
export type ProficiencyLevel =
  | 'none'
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood';

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface CharacterSkill {
  name: string;
  ability: AbilityKey;
  proficiency: ProficiencyLevel;
}

export interface CharacterTool {
  name: string;
  proficiency: ProficiencyLevel;
}

export interface CharacterSheet {
  id: string;
  name: string;
  level: number;
  proficiencyBonus: number;
  savingThrows: Record<AbilityKey, ProficiencyLevel>;
  skills: CharacterSkill[];
  tools: CharacterTool[];
}
