/**
 * @fileoverview Upgrades a persisted character to the current entity shape.
 * @description A sheet saved before the Damocles 2.0 migrations carries six
 * ability scores, the old skill list and a flat armour class; this maps them
 * onto five scores, the current skills, and Deflect plus Dodge
 *
 * @module modules/character-builder/lib/utils/characterMigration
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-16
 */

import type {
  AbilityKey,
  CharacterEntity,
  CharacterSkill,
  TierLevel,
} from '@/lib/types/character';
import {
  computeAbilityModifier,
  DEFENCE_BASE,
  SKILL_DEFAULTS,
} from './characterStorage';

/**
 * A persisted sheet as any past version wrote it.
 *
 * @property {object} abilityScores - Five scores, plus the old Intelligence when the sheet predates the mind stat
 * @property {Partial<Record<string, TierLevel>>} savingThrows - Save tiers, possibly keyed on the old Intelligence
 * @property {number} [ac] - The flat armour class old sheets carried
 * @property {number} [deflect] - Deflect, when the sheet is current
 * @property {number} [dodge] - Dodge, when the sheet is current
 */
export type LegacyCharacter = Omit<
  CharacterEntity,
  'abilityScores' | 'savingThrows' | 'deflect' | 'dodge'
> & {
  abilityScores: CharacterEntity['abilityScores'] & { int?: number };
  savingThrows?: Partial<Record<string, TierLevel>>;
  ac?: number;
  deflect?: number;
  dodge?: number;
};

/**
 * Skills that were renamed or split, old row key to the rows that inherit its tier.
 */
const SKILL_RENAMES: Readonly<Record<string, readonly string[]>> = {
  'skills.perception': ['skills.descry', 'skills.discern'],
  'skills.animalHandling': [],
};

/**
 * Rebuilds the skill list on the current defaults, carrying tiers across renames.
 *
 * @function migrateSkills
 * @param {CharacterSkill[]} skills - The persisted skill rows
 * @returns {CharacterSkill[]} One row per current skill, on its current ability
 */
export const migrateSkills = (skills: CharacterSkill[]): CharacterSkill[] => {
  const tiers = new Map<string, TierLevel>();
  for (const skill of skills ?? []) {
    for (const name of SKILL_RENAMES[skill.name] ?? [skill.name]) {
      tiers.set(name, skill.tier);
    }
  }
  return SKILL_DEFAULTS.map((skill) => ({
    ...skill,
    tier: tiers.get(skill.name) ?? 'none',
  }));
};

/**
 * Upgrades one persisted sheet.
 *
 * @description The mind stat is the old Intelligence, so an old sheet's
 * Intelligence score and save become its Wisdom; a flat armour class splits
 * into Dodge from Dexterity and Deflect from whatever the class carried above
 * that; the armour class lock key becomes the Defence lock key
 * @function migrateCharacter
 * @param {LegacyCharacter} raw - The sheet as read from storage
 * @returns {CharacterEntity} The sheet on the current shape
 */
export const migrateCharacter = (raw: LegacyCharacter): CharacterEntity => {
  const {
    ac,
    abilityScores: oldScores,
    savingThrows: oldSaves,
    skills,
    manualStatOverrides,
    deflect: oldDeflect,
    dodge: oldDodge,
    ...rest
  } = raw;
  const { int, ...scores } = oldScores;
  const abilityScores = { ...scores, wis: int ?? scores.wis };
  const { int: intSave, ...saves } = oldSaves ?? {};
  const savingThrows = Object.fromEntries(
    (['str', 'dex', 'con', 'wis', 'cha'] as const).map((key) => [
      key,
      (key === 'wis' ? intSave ?? saves.wis : saves[key]) ?? 'none',
    ]),
  ) as Record<AbilityKey, TierLevel>;
  const dexMod = computeAbilityModifier(abilityScores.dex);
  const dodge = oldDodge ?? dexMod;
  const deflect =
    oldDeflect ?? (ac === undefined ? 0 : Math.max(0, ac - DEFENCE_BASE - dexMod));
  return {
    ...rest,
    abilityScores,
    savingThrows,
    skills: migrateSkills(skills),
    manualStatOverrides: (manualStatOverrides ?? []).map((key) =>
      key === 'ac' ? 'defence' : key,
    ),
    deflect,
    dodge,
  };
};
