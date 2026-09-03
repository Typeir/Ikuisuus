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
} as const;

/**
 * Components that are entries of an heirloom: each opens with its own heading
 * and sectionizes as a nested section of the group around it.
 */
export const BLOCK_COMPONENTS = ['Feature', 'Trait', 'Curse', 'Pool'] as const;

/**
 * Slots of a feature, trait, or curse, in display order, which is the order a
 * use resolves in: what it costs, whether a use is left, who it reaches, and
 * how the uses come back. Charges and recharge are separate because a thing
 * can have uses that never come back, and a thing that recharges need not
 * count charges.
 */
export const FEATURE_SLOTS = {
  mastery: 'Mastery',
  deed: 'Deed',
  cost: 'Cost',
  charges: 'Charges',
  targets: 'Targets',
  recharge: 'Recharge',
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
 * Every slot name.
 */
export type SlotName = HeirloomSlotName | FeatureSlotName | PoolSlotName;

/**
 * Every authored element name.
 */
export type SlotElementName =
  | (typeof HEIRLOOM_SLOTS)[HeirloomSlotName]
  | (typeof FEATURE_SLOTS)[FeatureSlotName]
  | (typeof POOL_SLOTS)[PoolSlotName];

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
 * Every slot name, heirloom slots first. A name both hosts accept, such as
 * `charges`, is listed once: it carries one label and one element wherever it
 * is written, and only the host decides where the value lands.
 */
export const SLOT_NAMES: SlotName[] = [
  ...new Set<SlotName>([
    ...HEIRLOOM_SLOT_NAMES,
    ...FEATURE_SLOT_NAMES,
    ...POOL_SLOT_NAMES,
  ]),
];

/**
 * Authored element name → slot name.
 */
export const SLOT_NAME_BY_ELEMENT: Record<string, SlotName> =
  Object.fromEntries(
    SLOT_NAMES.map((name) => [SLOT_ELEMENT_NAMES[name], name]),
  );

/**
 * Header slots that form the stats row, in column order. A column prints only
 * when the item carries the slot; `versatile` rides inside the damage cell.
 */
export const STAT_SLOTS: readonly HeirloomSlotName[] = [
  'damage',
  'reach',
  'range',
  'armorClass',
  'stealth',
  'mastery',
  'masterfulBlow',
  'charges',
  'saveDc',
  'burden',
];

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
  Pool: POOL_SLOTS,
};

/**
 * Message-catalogue key of a slot's label, under the `library` namespace.
 *
 * @param {SlotName} name - Slot name
 * @returns {string} Catalogue key
 */
export function slotLabelKey(name: SlotName): string {
  return `slots.${name}`;
}
