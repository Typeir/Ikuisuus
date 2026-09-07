/**
 * @fileoverview A host's own words for shared slots, and the catalogue key a
 * slot's label lives under.
 * @module modules/library/domain/slotLabels
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import type { SlotName } from './slots';

/**
 * A host's own word for a shared slot.
 */
export const SLOT_LABEL_OVERRIDES: Readonly<
  Record<string, Readonly<Partial<Record<SlotName, string>>>>
> = {
  Spell: { cost: 'castingTime' },
  Vocation: {
    saves: 'savingThrowProficiencies',
    skills: 'skillProficiencies',
    trades: 'tradeProficiencies',
    weapons: 'weaponProficiencies',
  },
  Specialization: {
    saves: 'savingThrowProficiencies',
    skills: 'skillProficiencies',
    trades: 'tradeProficiencies',
    weapons: 'weaponProficiencies',
  },
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
