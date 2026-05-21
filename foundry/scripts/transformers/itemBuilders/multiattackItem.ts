/**
 * @fileoverview Multiattack item builder for Foundry dnd5e items.
 * @description Constructs feat items with Utility Activity for multiattack
 * features.
 *
 * @module foundry/scripts/transformers/itemBuilders/multiattackItem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import { createUtilityActivity } from '../constants/activityTemplates';
import { activation, resolveActivation } from './activation';
import type { FoundryItem } from './featureTransformer';
import { buildFlags, toIdentifier } from './utils';

/**
 * Builds a dnd5e feat item for a multiattack feature.
 *
 * @param {MonsterFeature} feature - Source feature with multiattack data
 * @param {string} itemId - Generated Foundry document ID
 * @returns {FoundryItem} Feat item with Utility Activity
 */
export function buildMultiattackItem(
  feature: MonsterFeature,
  itemId: string,
): FoundryItem {
  const attacks = feature
    .multiattack!.attacks.map(
      (a) => `${a.count} ${a.name}${a.count > 1 ? ' attacks' : ' attack'}`,
    )
    .join(', ');
  const actType = resolveActivation(feature);
  return {
    _id: itemId,
    name: feature.name,
    type: 'feat',
    system: {
      description: { value: `<p>The creature makes ${attacks}.</p>` },
      type: { value: 'monster', subtype: '' },
      identifier: toIdentifier(feature.name),
      activities: {
        dnd5eactivity000: createUtilityActivity({
          base: {
            activation: activation(actType !== 'none' ? actType : 'action'),
          },
        }),
      },
    },
    flags: buildFlags(feature),
  };
}
