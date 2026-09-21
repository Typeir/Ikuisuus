/**
 * @fileoverview Monster slot schema.
 * @description Kept beside the main schema so that file stays under its
 * length limit
 *
 * @module modules/library/domain/monsterSlots
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-15
 */

/**
 * Header slots of a monster.
 */
export const MONSTER_SLOTS = {
  size: 'Size',
  type: 'Type',
  alignment: 'Alignment',
  defence: 'Defence',
  deflect: 'Deflect',
  dodge: 'Dodge',
  hitPoints: 'HitPoints',
  poise: 'Poise',
  stability: 'Stability',
  speed: 'Speed',
  str: 'Str',
  dex: 'Dex',
  con: 'Con',
  int: 'Int',
  wis: 'Wis',
  cha: 'Cha',
  saves: 'Saves',
  skills: 'Skills',
  resistances: 'Resistances',
  vulnerabilities: 'Vulnerabilities',
  immunities: 'Immunities',
  conditionImmunities: 'ConditionImmunities',
  senses: 'Senses',
  languages: 'Languages',
  damageThreshold: 'DamageThreshold',
  material: 'Material',
  saveDc: 'SaveDc',
  lethality: 'Lethality',
  xp: 'Xp',
  tierBonus: 'TierBonus',
} as const;

/**
 * Monster slot names.
 */
export type MonsterSlotName = keyof typeof MONSTER_SLOTS;

/**
 * Monster slot names in display order.
 */
export const MONSTER_SLOT_NAMES = Object.keys(
  MONSTER_SLOTS,
) as MonsterSlotName[];

/**
 * The six ability scores a monster sheet carries, in sheet order.
 */
export const ABILITY_SLOTS: readonly MonsterSlotName[] = [
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
];

/**
 * Monster slots that print as the labelled list under the tables, in order.
 */
export const MONSTER_LIST_SLOTS: readonly MonsterSlotName[] = [
  'speed',
  'saves',
  'skills',
  'resistances',
  'vulnerabilities',
  'immunities',
  'conditionImmunities',
  'senses',
  'languages',
  'material',
  'saveDc',
  'lethality',
  'xp',
  'tierBonus',
];
