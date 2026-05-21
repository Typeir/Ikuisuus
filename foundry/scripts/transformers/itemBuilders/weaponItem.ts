/**
 * @fileoverview Weapon item builder for Foundry dnd5e items.
 * @description Constructs weapon items with Attack Activity and optional
 * Save Activity from MonsterFeature attack data.
 *
 * @module foundry/scripts/transformers/itemBuilders/weaponItem
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import {
    createAttackActivity,
    createCustomDamagePart,
    createDamagePart,
    createSaveActivity,
} from '../constants/activityTemplates';
import type { FoundryActivity } from '../handlers/types';
import { activation, resolveActivation } from './activation';
import type { FoundryItem } from './featureTransformer';
import { parseDamageFormula } from './featureTransformer';
import {
    EMPTY_DAMAGE_FIELD,
    buildFlags,
    buildUses,
    toDamageField,
    toIdentifier,
} from './utils';

/**
 * Builds a dnd5e weapon item for a feature with an attack token.
 *
 * @param {MonsterFeature} feature - Source feature with attack data
 * @param {string} itemId - Generated Foundry document ID
 * @returns {FoundryItem} Weapon item with Attack Activity
 */
export function buildWeaponItem(
  feature: MonsterFeature,
  itemId: string,
): FoundryItem {
  const atk = feature.attack!;
  const actType = resolveActivation(feature);
  const critThreshold = feature.meta?.critRange
    ? parseInt(feature.meta.critRange, 10)
    : null;
  const atkDamageParts: ReturnType<typeof createDamagePart>[] = [];
  if (feature.damageFlat) {
    const fp = parseDamageFormula(feature.damageFlat);
    if (fp) {
      atkDamageParts.push(
        createDamagePart(
          fp.count,
          fp.sides,
          feature.damageFlatType ?? '',
          fp.bonus,
        ),
      );
    } else {
      atkDamageParts.push(
        createCustomDamagePart(
          feature.damageFlat,
          feature.damageFlatType ?? '',
        ),
      );
    }
  }
  const activities: Record<string, FoundryActivity> = {
    dnd5eactivity000: createAttackActivity({
      ability: atk.type === 'ranged' ? 'dex' : 'str',
      bonus: String(atk.bonus),
      criticalThreshold: critThreshold,
      flat: true,
      attackType: atk.type === 'ranged' ? 'ranged' : 'melee',
      classification: 'weapon',
      includeBase: true,
      damageParts: atkDamageParts,
      base: { activation: activation(actType) },
    }),
  };
  if (feature.saving_throw) {
    const fp = feature.damageFlat
      ? parseDamageFormula(feature.damageFlat)
      : null;
    activities['dnd5eactivity100'] = createSaveActivity({
      id: 'dnd5eactivity100',
      ability: feature.saving_throw.ability,
      dcFormula: String(feature.saving_throw.dc),
      onSave: 'half',
      damageParts: fp
        ? [createDamagePart(fp.count, fp.sides, feature.damageFlatType ?? '')]
        : [],
    });
  }
  const system: Record<string, unknown> = {
    description: { value: feature.description ?? '' },
    type: { value: 'natural', baseItem: '' },
    damage: {
      base: feature.damage
        ? toDamageField(feature.damage, feature.damageType ?? '')
        : EMPTY_DAMAGE_FIELD,
      versatile: EMPTY_DAMAGE_FIELD,
    },
    range: {
      value: atk.reach ?? null,
      long: atk.range?.long ?? null,
      units: 'ft',
      reach: atk.reach ?? null,
    },
    properties: [],
    proficient: 1,
    equipped: true,
    identifier: toIdentifier(feature.name),
    activities,
  };
  if (feature.recharge) system.uses = buildUses(feature);
  return {
    _id: itemId,
    name: feature.name,
    type: 'weapon',
    system,
    flags: buildFlags(feature),
  };
}
