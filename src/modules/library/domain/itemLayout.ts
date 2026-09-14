/**
 * @fileoverview Where each item slot lands on the card.
 * @description The item schema names the slots; this says which the brief
 * speaks
 *
 * @module modules/library/domain/itemLayout
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import type { HeirloomSlotName } from './slots';

/**
 * Header slots that form the stats row, in column order.
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
 * Item slots the brief speaks
 */
export const ITEM_BRIEF_SLOTS: readonly HeirloomSlotName[] = [
  'rarity',
  'attunement',
  'category',
  'pattern',
  'base',
  'quality',
  'enchantment',
  'focus',
  'nullifying',
];

/**
 * Item slots that print as rows, in display order.
 */
export const ITEM_ROW_SLOTS: readonly HeirloomSlotName[] = [
  'attributes',
  'cost',
  'charges',
  'recharge',
  'damage',
  'versatile',
  'reach',
  'range',
  'armorClass',
  'stealth',
  'mastery',
  'masterfulBlow',
  'saveDc',
  'properties',
  'burden',
  'price',
];
