/**
 * @fileoverview Passive item builder for Foundry dnd5e items.
 * @description Constructs feat items for passive features, with optional
 * Utility Activity for legendary deed features.
 *
 * @module foundry/scripts/transformers/itemBuilders/passiveItem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import { createUtilityActivity } from '../constants/activityTemplates';
import { activation, resolveActivation } from './activation';
import type { FoundryItem } from './featureTransformer';
import { buildFlags, buildUses, toIdentifier } from './utils';

/**
 * Builds a dnd5e feat item for a passive feature.
 * Legendary deed features with an action trigger get a Utility Activity.
 *
 * @param {MonsterFeature} feature - Source passive feature
 * @param {string} itemId - Generated Foundry document ID
 * @returns {FoundryItem} Feat item with optional Utility Activity
 */
export function buildPassiveItem(
  feature: MonsterFeature,
  itemId: string,
): FoundryItem {
  const actType = resolveActivation(feature);
  const needsActivity = feature.legendary_deed && actType !== 'none';
  const system: Record<string, unknown> = {
    description: { value: feature.description ?? '' },
    type: { value: 'monster', subtype: '' },
    identifier: toIdentifier(feature.name),
    activities: needsActivity
      ? {
          dnd5eactivity000: createUtilityActivity({
            base: { activation: activation(actType) },
          }),
        }
      : {},
  };
  if (feature.recharge) system.uses = buildUses(feature);
  return {
    _id: itemId,
    name: feature.name,
    type: 'feat',
    system,
    flags: buildFlags(feature),
  };
}
