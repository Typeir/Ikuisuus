/**
 * @fileoverview Activation type resolution for Foundry items.
 * @description Handles conversion of MonsterFeature triggers to dnd5e
 * activation types and builds activation blocks for Activities.
 *
 * @module foundry/scripts/transformers/itemBuilders/activation
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';

/** @type {Record<string, string>} Maps MonsterFeature triggers to dnd5e activation types. */
const TRIGGER_MAP: Record<string, string> = {
  action: 'action',
  bonus_action: 'bonus',
  reaction: 'reaction',
  passive: 'none',
  free: 'none',
};

/**
 * Resolves the dnd5e activation type from a MonsterFeature.
 *
 * @param {MonsterFeature} feature - Source feature
 * @returns {string} dnd5e activation type string
 */
export function resolveActivation(feature: MonsterFeature): string {
  if (feature.legendary_deed?.category === 'lair') return 'lair';
  if (feature.legendary_deed?.category === 'act') return 'legendary';
  return TRIGGER_MAP[feature.trigger ?? 'passive'] ?? 'none';
}

/**
 * Builds an activation block for an Activity.
 *
 * @param {string} type - Activation type
 * @returns {object} ActivityActivation block
 */
export function activation(type: string) {
  return {
    type,
    value: type !== 'none' ? 1 : null,
    condition: '',
    override: false,
  };
}
