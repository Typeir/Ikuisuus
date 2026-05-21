/**
 * @fileoverview Save/feat item builder for Foundry dnd5e items.
 * @description Constructs feat items with Save Activity for save-only features
 * (no attack component).
 *
 * @module foundry/scripts/transformers/itemBuilders/saveFeatItem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import {
    createCustomDamagePart,
    createDamagePart,
    createSaveActivity,
} from '../constants/activityTemplates';
import { activation, resolveActivation } from './activation';
import type { FoundryItem } from './featureTransformer';
import { parseDamageFormula } from './featureTransformer';
import { buildFlags, buildUses, toIdentifier } from './utils';

/**
 * Builds a dnd5e feat item for a save-only feature (no attack).
 *
 * @param {MonsterFeature} feature - Source feature with saving throw data
 * @param {string} itemId - Generated Foundry document ID
 * @returns {FoundryItem} Feat item with Save Activity
 */
export function buildSaveFeatItem(
  feature: MonsterFeature,
  itemId: string,
): FoundryItem {
  const save = feature.saving_throw!;
  const dp: ReturnType<typeof createDamagePart>[] = [];
  if (feature.damage) {
    const p = parseDamageFormula(feature.damage);
    if (p) {
      dp.push(createDamagePart(p.count, p.sides, feature.damageType ?? ''));
    } else {
      dp.push(createCustomDamagePart(feature.damage, feature.damageType ?? ''));
    }
  }
  const system: Record<string, unknown> = {
    description: { value: feature.description ?? '' },
    type: { value: 'monster', subtype: '' },
    identifier: toIdentifier(feature.name),
    activities: {
      dnd5eactivity000: createSaveActivity({
        ability: save.ability,
        dcFormula: String(save.dc),
        onSave: 'half',
        damageParts: dp,
        base: { activation: activation(resolveActivation(feature)) },
      }),
    },
  };
  if (feature.recharge) system.uses = buildUses(feature);
  if (feature.target)
    system.target = {
      value: feature.target.range ?? null,
      units: 'ft',
      type: feature.target.type ?? '',
    };
  return {
    _id: itemId,
    name: feature.name,
    type: 'feat',
    system,
    flags: buildFlags(feature),
  };
}
