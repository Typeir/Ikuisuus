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
} as const;

/**
 * Components that are entries of an heirloom: each opens with its own heading
 * and sectionizes as a nested section of the group around it.
 */
export const BLOCK_COMPONENTS = ['Feature', 'Trait', 'Curse'] as const;

/**
 * Anchor of the group heading the stats list is filed under. An author who
 * writes that heading claims the numbers; the heirloom fills the section in.
 * Without it the list follows the rule that closes the primer.
 */
export const STATS_SECTION_ANCHOR = 'attributes';

/**
 * Slots of a feature, trait, or curse, in display order.
 */
export const FEATURE_SLOTS = {
  cost: 'Cost',
  targets: 'Targets',
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
 * Every slot name.
 */
export type SlotName = HeirloomSlotName | FeatureSlotName;

/**
 * Every authored element name.
 */
export type SlotElementName =
  | (typeof HEIRLOOM_SLOTS)[HeirloomSlotName]
  | (typeof FEATURE_SLOTS)[FeatureSlotName];

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
 * Every slot name, heirloom slots first.
 */
export const SLOT_NAMES: SlotName[] = [
  ...HEIRLOOM_SLOT_NAMES,
  ...FEATURE_SLOT_NAMES,
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
  'burden',
];

/**
 * Message-catalogue key of a slot's label, under the `library` namespace.
 *
 * @param {SlotName} name - Slot name
 * @returns {string} Catalogue key
 */
export function slotLabelKey(name: SlotName): string {
  return `slots.${name}`;
}
