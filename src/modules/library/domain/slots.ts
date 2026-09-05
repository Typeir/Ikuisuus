/**
 * @fileoverview Slot schema for the library's card components.
 * @description One table per parent component: slot name → authored element
 * name. The parents' prop types, the generated slot elements, the message
 * keys, and the metadata extractor all derive from these tables, so a slot is
 * added by adding one row. Attributes are the default spelling
 * (`<Feature cost="…">`); the element form (`<Cost>…</Cost>`) exists for a
 * value that carries markup or a literal quote.
 *
 * The heirloom's header slots feed two renderings, never a label list: the
 * identity slots become the three-line italic brief under the title, and the
 * number slots become the stats row at the `---` position.
 *
 * @module modules/library/domain/slots
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-03
 */

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
] as const;

/**
 * Slots of a feature, trait, or curse, in display order: whether it is
 * available at all, what a use costs, what opens the window, how many uses
 * there are, how they come back, when the use resolves, and who it reaches.
 * Charges sits next to recharge because the two read together. Charges and
 * recharge stay separate because a thing can have uses that never come back,
 * and a thing that recharges need not count charges.
 *
 * `cost` prints at the heading's right edge rather than in the slot line, and
 * carries the token spent and nothing else, so the right edge of every card
 * reads as one column. A block that costs no token and waits on something
 * carries `trigger` alone, which leads the rendered row: trigger, charges,
 * recharge, deed, targets.
 */
export const FEATURE_SLOTS = {
  level: 'Level',
  mastery: 'Mastery',
  cost: 'Cost',
  trigger: 'Trigger',
  charges: 'Charges',
  recharge: 'Recharge',
  deed: 'Deed',
  targets: 'Targets',
} as const;

/**
 * Slots of a pool: how much it holds and how it refills. A pool is a number
 * the host owns and its blocks spend from, so it belongs to no one host —
 * trinkets, monsters and vocations can carry one on the same terms.
 */
export const POOL_SLOTS = {
  max: 'Max',
  recharge: 'Recharge',
} as const;

/**
 * Header slots of a spell. Casting time is the tempo currency a cast spends,
 * so it is the same `cost` slot a feature carries and takes the same values —
 * `1 Major Action`, `1 Reaction`, `1 Reflex`. A spell that waits on something
 * carries `trigger` beside it, exactly as a reaction feature does.
 */
export const SPELL_SLOTS = {
  level: 'Level',
  school: 'School',
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
 * Header slots of a trinket. A trinket is an item, and the item card carries
 * every slot either kind uses, so both draw from one table and a slot cannot
 * mean two things depending on which tag wrote it.
 */
export const TRINKET_SLOTS = HEIRLOOM_SLOTS;

/**
 * Header slots of a monster. The six ability scores are written as scores
 * alone; the card derives each modifier, so no sheet hand-maintains a number
 * arithmetic already knows. `tierBonus` derives from `challenge` on the same
 * principle and is written only where a sheet overrides it. `saveDc` is the
 * one fixed DC a sheet's effects share, and it is a number: a DC that is a
 * formula belongs in the prose of the block that uses it.
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
 * Header slots of a vocation: the core traits table, one row per slot.
 */
export const VOCATION_SLOTS = {
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
 * Feat categories. Expected to change: this is the one place a name lives, so
 * renaming one is a single edit here plus its label in the catalogue.
 */
export const FEAT_CATEGORIES = ['general', 'origin', 'epic boon'] as const;

/**
 * Feat category values.
 */
export type FeatCategory = (typeof FEAT_CATEGORIES)[number];

/**
 * Catalogue key for a feat category. Authors write the category the way it
 * reads — `epic boon` — and the label lives under a key with no space in it,
 * because a message path is dot-separated.
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
 * Header slots of a feat. `ability` names the score a feat raises, which the
 * card writes out as its own sentence. `prerequisite` is free text and takes
 * any condition an author can state, including a boolean expression.
 */
export const FEAT_SLOTS = {
  category: 'Category',
  prerequisite: 'Prerequisite',
  ability: 'Ability',
  repeatable: 'Repeatable',
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
 * Feat slot names.
 */
export type FeatSlotName = keyof typeof FEAT_SLOTS;

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
  | FeatSlotName;

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
  | (typeof FEAT_SLOTS)[FeatSlotName];

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
  ...FEAT_SLOTS,
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
 * Feat slot names in display order.
 */
export const FEAT_SLOT_NAMES = Object.keys(FEAT_SLOTS) as FeatSlotName[];

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
 * The tables above take the rest.
 */
export const MONSTER_LIST_SLOTS: readonly MonsterSlotName[] = [
  'saves',
  'skills',
  'resistances',
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
 * Every slot name, heirloom slots first. A name both hosts accept, such as
 * `charges`, is listed once: it carries one label and one element wherever it
 * is written, and only the host decides where the value lands.
 */
export const SLOT_NAMES: SlotName[] = [
  ...new Set<SlotName>([
    ...HEIRLOOM_SLOT_NAMES,
    ...FEATURE_SLOT_NAMES,
    ...POOL_SLOT_NAMES,
    ...SPELL_SLOT_NAMES,
    ...MONSTER_SLOT_NAMES,
    ...VOCATION_SLOT_NAMES,
    ...FEAT_SLOT_NAMES,
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
 * The compile pipeline reads this to move a slot attribute that carries
 * markup into its element form.
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
  Feat: FEAT_SLOTS,
};

/**
 * A host's own word for a shared slot. A spell spends the same tempo currency
 * a feature does, so it carries the same `cost` slot; it just calls the line
 * Casting Time. The value and its meaning are shared, the label is not.
 */
export const SLOT_LABEL_OVERRIDES: Readonly<
  Record<string, Readonly<Partial<Record<SlotName, string>>>>
> = {
  Spell: { cost: 'castingTime' },
};

/**
 * Message-catalogue key of a slot's label, under the `library` namespace.
 *
 * @param {SlotName} name - Slot name
 * @param {string} [host] - Host component name, when it renames the slot
 * @returns {string} Catalogue key
 */
export function slotLabelKey(name: SlotName, host?: string): string {
  const override = host ? SLOT_LABEL_OVERRIDES[host]?.[name] : undefined;
  return `slots.${override ?? name}`;
}
