/**
 * @fileoverview Slot schema for the library's card components.
 * @description One table per parent component: slot name → authored element
 * name.
 *
 * @module modules/library/domain/slots
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-03
 */

import { BLOODLINE_SLOT_NAMES, BLOODLINE_SLOTS, type BloodlineSlotName } from './bloodlineSlots';

/**
 * Header slots of an heirloom.
 */
export const HEIRLOOM_SLOTS = {
  rarity: 'Rarity',
  attunement: 'Attunement',
  base: 'Base',
  quality: 'Quality',
  enchantment: 'Enchantment',
  damage: 'Damage',
  versatile: 'Versatile',
  reach: 'Reach',
  range: 'Range',
  armorClass: 'ArmorClass',
  stealth: 'Stealth',
  mastery: 'Mastery',
  masterfulBlow: 'MasterfulBlow',
  charges: 'Charges',
  burden: 'Burden',
  focus: 'Focus',
  nullifying: 'Nullifying',
  saveDc: 'SaveDc',
  category: 'Category',
  properties: 'Properties',
  price: 'Price',
  cost: 'Cost',
  recharge: 'Recharge',
} as const;

/**
 * Components that are entries of an heirloom: each opens with its own heading
 * and sectionizes as a nested section of the group around it.
 */
export const BLOCK_COMPONENTS = [
  'Feature',
  'Trait',
  'Curse',
  'Action',
  'Pool',
  'Attack',
] as const;

/**
 * Slots of a feature, trait, or curse, in display order: whether it is
 * available at all, what a use costs, what opens the window, how many uses
 * there are, how they come back, when the use resolves, and who it reaches.
 */
export const FEATURE_SLOTS = {
  level: 'Level',
  mastery: 'Mastery',
  cost: 'Cost',
  trigger: 'Trigger',
  charges: 'Charges',
  recharge: 'Recharge',
  deed: 'Deed',
  accuracy: 'Accuracy',
  saveDc: 'SaveDc',
  targets: 'Targets',
} as const;

/**
 * Slots of a pool: how much it holds and how it refills.
 */
export const POOL_SLOTS = {
  max: 'Max',
  recharge: 'Recharge',
} as const;

/**
 * Header slots of a spell.
 */
export const SPELL_SLOTS = {
  level: 'Level',
  rarity: 'Rarity',
  ritual: 'Ritual',
  cost: 'Cost',
  trigger: 'Trigger',
  components: 'Components',
  duration: 'Duration',
  range: 'Range',
  targets: 'Targets',
  overcast: 'Overcast',
} as const;

/**
 * Header slots of a trinket.
 */
export const TRINKET_SLOTS = HEIRLOOM_SLOTS;

/**
 * Header slots of a monster.
 */
export const MONSTER_SLOTS = {
  size: 'Size',
  type: 'Type',
  alignment: 'Alignment',
  armorClass: 'ArmorClass',
  hitPoints: 'HitPoints',
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
  saveDc: 'SaveDc',
  challenge: 'Challenge',
  xp: 'Xp',
  tierBonus: 'TierBonus',
} as const;

/**
 * Header slots of a vocation: the core traits table, one row per slot, and
 * `vocation`, the parent a specialization names by slug.
 */
export const VOCATION_SLOTS = {
  vocation: 'Parent',
  primaryAbility: 'PrimaryAbility',
  hitDie: 'HitDie',
  saves: 'Saves',
  skills: 'Skills',
  trades: 'Trades',
  weapons: 'Weapons',
  armor: 'Armor',
  equipment: 'Equipment',
} as const;

/**
 * Header slots of a specialization: the vocation's table, of which a
 * specialization writes the parent alone.
 */
export const SPECIALIZATION_SLOTS = VOCATION_SLOTS;

/**
 * Feat categories.
 */
export const FEAT_CATEGORIES = ['general', 'origin', 'epic boon'] as const;

/**
 * Feat category values.
 */
export type FeatCategory = (typeof FEAT_CATEGORIES)[number];

/**
 * Catalogue key for a feat category.
 *
 * @param {string} category - Authored category, any casing
 * @returns {string} Catalogue key under `library.feat.category`
 *
 * @example
 * featCategoryKey('Epic Boon'); // 'epicBoon'
 */
export function featCategoryKey(category: string): string {
  const [head, ...rest] = category.trim().toLowerCase().split(/\s+/);
  return head + rest.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
}

/**
 * Header slots of a feat.
 */
export const FEAT_SLOTS = {
  category: 'Category',
  prerequisite: 'Prerequisite',
  ability: 'Ability',
  repeatable: 'Repeatable',
} as const;

/**
 * Slots of an attack inside an action: what it rolls with, how far it
 * reaches or ranges, and whom it strikes when that is not one creature.
 */
export const ATTACK_SLOTS = {
  accuracy: 'Accuracy',
  reach: 'Reach',
  range: 'Range',
  targets: 'Targets',
} as const;

/**
 * Heirloom slot names.
 */
export type HeirloomSlotName = keyof typeof HEIRLOOM_SLOTS;

/**
 * Feature slot names.
 */
export type FeatureSlotName = keyof typeof FEATURE_SLOTS;

/**
 * Pool slot names.
 */
export type PoolSlotName = keyof typeof POOL_SLOTS;

/**
 * Spell slot names.
 */
export type SpellSlotName = keyof typeof SPELL_SLOTS;

/**
 * Trinket slot names.
 */
export type TrinketSlotName = HeirloomSlotName;

/**
 * Monster slot names.
 */
export type MonsterSlotName = keyof typeof MONSTER_SLOTS;

/**
 * Vocation slot names.
 */
export type VocationSlotName = keyof typeof VOCATION_SLOTS;

/**
 * Specialization slot names.
 */
export type SpecializationSlotName = VocationSlotName;

/**
 * Feat slot names.
 */
export type FeatSlotName = keyof typeof FEAT_SLOTS;

/**
 * Attack slot names.
 */
export type AttackSlotName = keyof typeof ATTACK_SLOTS;

/**
 * Every slot name.
 */
export type SlotName =
  | HeirloomSlotName
  | FeatureSlotName
  | PoolSlotName
  | SpellSlotName
  | MonsterSlotName
  | VocationSlotName
  | BloodlineSlotName
  | FeatSlotName
  | AttackSlotName;

/**
 * Every authored element name.
 */
export type SlotElementName =
  | (typeof HEIRLOOM_SLOTS)[HeirloomSlotName]
  | (typeof FEATURE_SLOTS)[FeatureSlotName]
  | (typeof POOL_SLOTS)[PoolSlotName]
  | (typeof SPELL_SLOTS)[SpellSlotName]
  | (typeof MONSTER_SLOTS)[MonsterSlotName]
  | (typeof VOCATION_SLOTS)[VocationSlotName]
  | (typeof BLOODLINE_SLOTS)[BloodlineSlotName]
  | (typeof FEAT_SLOTS)[FeatSlotName]
  | (typeof ATTACK_SLOTS)[AttackSlotName];

/**
 * A slot value as MDX hands it to the parent: a string attribute, the
 * fragment the attribute rewrite built from a shortcode-bearing string, or
 * element children.
 */
export type SlotValue = unknown;

/**
 * Slot props of a parent component, derived from its slot names.
 */
export type SlotProps<N extends SlotName> = Partial<Record<N, SlotValue>>;

/**
 * Slot name → authored element name, both parents merged.
 */
export const SLOT_ELEMENT_NAMES: Record<SlotName, SlotElementName> = {
  ...HEIRLOOM_SLOTS,
  ...FEATURE_SLOTS,
  ...POOL_SLOTS,
  ...SPELL_SLOTS,
  ...MONSTER_SLOTS,
  ...VOCATION_SLOTS,
  ...BLOODLINE_SLOTS,
  ...FEAT_SLOTS,
  ...ATTACK_SLOTS,
};

/**
 * Heirloom slot names in schema order.
 */
export const HEIRLOOM_SLOT_NAMES = Object.keys(
  HEIRLOOM_SLOTS,
) as HeirloomSlotName[];

/**
 * Feature slot names in display order.
 */
export const FEATURE_SLOT_NAMES = Object.keys(
  FEATURE_SLOTS,
) as FeatureSlotName[];

/**
 * Pool slot names in display order.
 */
export const POOL_SLOT_NAMES = Object.keys(POOL_SLOTS) as PoolSlotName[];

/**
 * Spell slot names in display order.
 */
export const SPELL_SLOT_NAMES = Object.keys(SPELL_SLOTS) as SpellSlotName[];

/**
 * Trinket slot names in display order; the item card's own list.
 */
export const TRINKET_SLOT_NAMES: readonly TrinketSlotName[] =
  HEIRLOOM_SLOT_NAMES;

/**
 * Monster slot names in display order.
 */
export const MONSTER_SLOT_NAMES = Object.keys(
  MONSTER_SLOTS,
) as MonsterSlotName[];

/**
 * Vocation slot names in display order.
 */
export const VOCATION_SLOT_NAMES = Object.keys(
  VOCATION_SLOTS,
) as VocationSlotName[];

/**
 * Specialization slot names in display order; the vocation card's own list.
 */
export const SPECIALIZATION_SLOT_NAMES: readonly SpecializationSlotName[] =
  VOCATION_SLOT_NAMES;

/**
 * Feat slot names in display order.
 */
export const FEAT_SLOT_NAMES = Object.keys(FEAT_SLOTS) as FeatSlotName[];

/**
 * Attack slot names in display order.
 */
export const ATTACK_SLOT_NAMES = Object.keys(
  ATTACK_SLOTS,
) as AttackSlotName[];

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
  'saves',
  'skills',
  'resistances',
  'vulnerabilities',
  'immunities',
  'conditionImmunities',
  'senses',
  'languages',
  'saveDc',
  'challenge',
  'xp',
  'tierBonus',
];

/**
 * Every slot name, heirloom slots first.
 */
export const SLOT_NAMES: SlotName[] = [
  ...new Set<SlotName>([
    ...HEIRLOOM_SLOT_NAMES,
    ...FEATURE_SLOT_NAMES,
    ...POOL_SLOT_NAMES,
    ...SPELL_SLOT_NAMES,
    ...MONSTER_SLOT_NAMES,
    ...VOCATION_SLOT_NAMES,
    ...BLOODLINE_SLOT_NAMES,
    ...FEAT_SLOT_NAMES,
    ...ATTACK_SLOT_NAMES,
  ]),
];

/**
 * Authored element name → slot name.
 */
export const SLOT_NAME_BY_ELEMENT: Record<string, SlotName> =
  Object.fromEntries(
    SLOT_NAMES.map((name) => [SLOT_ELEMENT_NAMES[name], name]),
  );

export { ITEM_BRIEF_SLOTS, ITEM_ROW_SLOTS, STAT_SLOTS } from './itemLayout';

/**
 * Which slots each component accepts, as slot name to authored element name.
 */
export const SLOT_HOSTS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  Heirloom: HEIRLOOM_SLOTS,
  Feature: FEATURE_SLOTS,
  Trait: FEATURE_SLOTS,
  Curse: FEATURE_SLOTS,
  Action: FEATURE_SLOTS,
  Pool: POOL_SLOTS,
  Spell: SPELL_SLOTS,
  Trinket: TRINKET_SLOTS,
  Monster: MONSTER_SLOTS,
  Vocation: VOCATION_SLOTS,
  Specialization: SPECIALIZATION_SLOTS,
  Bloodline: BLOODLINE_SLOTS,
  Feat: FEAT_SLOTS,
  Attack: ATTACK_SLOTS,
};

export { SLOT_LABEL_OVERRIDES, slotLabelKey } from './slotLabels';
export { BLOODLINE_SLOTS, BLOODLINE_SLOT_NAMES, BLOODLINE_TABLES, type BloodlineSlotName } from './bloodlineSlots';

