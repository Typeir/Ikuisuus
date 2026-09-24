/**
 * @fileoverview Slot elements and the slot row.
 * @description Generates one inline element per schema row (`<Cost>`,
 * `<Attunement>`, …) and re-exports the reading helpers from slotReading
 *
 * @module modules/library/presentation/components/slots/utils/slotElements
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

'use client';

import {
  SLOT_ELEMENT_NAMES,
  SLOT_NAMES,
  slotLabelKey,
  type SlotElementName,
  type SlotName,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import styles from '../feature/slots.module.scss';

export type { SlotName } from '@/modules/library/domain/slots';
export {
  cleanChildren,
  collectSlotEntries,
  inlineValue,
  isSlotNode,
  readSlots,
  slotNameOf,
  splitSlotRuns,
  type SlotEntry,
  type SlotReading,
} from './slotReading';

/**
 * Label + value row for one slot.
 *
 * @param {object} props - Row props
 * @param {SlotName} props.name - Slot name, drives label key and data attribute
 * @param {string} [props.host] - Host component name, when it renames the slot
 * @param {string} [props.label] - Label already resolved, where a slot builds its own
 * @param {ReactNode} [props.children] - Slot value
 * @returns {JSX.Element} The row
 */
export function SlotRow({
  name,
  host,
  label,
  children,
}: {
  name: SlotName;
  host?: string;
  label?: string;
  children?: ReactNode;
}): React.JSX.Element {
  const t = useTranslations('library');
  return (
    <span className={styles.row} data-slot={name}>
      <span className={styles.label} data-slot-label>
        {label ?? t(slotLabelKey(name, host))}
      </span>
      <span data-slot-value>{children}</span>
    </span>
  );
}

/**
 * Slot element component type.
 */
export type SlotElement = React.FC<{ children?: ReactNode }>;

/**
 * Creates the element for one schema row; its `displayName` is the authored
 * element name and its identity.
 *
 * @param {SlotName} name - Slot name
 * @returns {SlotElement} The slot element
 */
function makeSlot(name: SlotName): SlotElement {
  const Component: SlotElement = ({ children }) => (
    <SlotRow name={name}>{children}</SlotRow>
  );
  Component.displayName = SLOT_ELEMENT_NAMES[name];
  return Component;
}

/**
 * Generated slot elements keyed by authored element name.
 */
export const slotElements = Object.fromEntries(
  SLOT_NAMES.map((name) => [SLOT_ELEMENT_NAMES[name], makeSlot(name)]),
) as Record<SlotElementName, SlotElement>;

/**
 * Slot element for a slot name.
 *
 * @param {SlotName} name - Slot name
 * @returns {SlotElement} The generated element
 */
export function slotElementOf(name: SlotName): SlotElement {
  return slotElements[SLOT_ELEMENT_NAMES[name]];
}

export const {
  Rarity,
  Attunement,
  Pattern,
  Base,
  AttributeList,
  Quality,
  Enchantment,
  Damage,
  Versatile,
  Reach,
  Range,
  Accuracy,
  Defence,
  Deflect,
  Dodge,
  MaxDodge,
  DamageThreshold,
  Material,
  Stealth,
  Mastery,
  MasterfulBlow,
  Charges,
  Burden,
  Focus,
  Nullifying,
  SaveDc,
  Category,
  Properties,
  Price,
  Cost,
  Recharge,
  Level,
  Trigger,
  Deed,
  Targets,
  Max,
  Ritual,
  Components,
  Duration,
  Overcast,
  Size,
  Type,
  Alignment,
  HitPoints,
  Stability,
  Poise,
  Speed,
  Str,
  Dex,
  Con,
  Int,
  Wis,
  Cha,
  Saves,
  Skills,
  Resistances,
  Vulnerabilities,
  Immunities,
  ConditionImmunities,
  Senses,
  Languages,
  Lethality,
  Xp,
  TierBonus,
  Parent,
  PrimaryAbility,
  HitDie,
  Trades,
  Weapons,
  Armor,
  Equipment,
  Prerequisite,
  Ability,
  Repeatable,
  AbilityScores,
  Speeds,
  CreatureTypes,
  Age,
} = slotElements;
