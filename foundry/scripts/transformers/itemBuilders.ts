/**
 * @fileoverview Builder functions for dnd5e 5.3 Foundry item types.
 * @description Each builder constructs a specific item category (weapon,
 * save-feat, multiattack, passive) from a MonsterFeature using the
 * dnd5e Activity model. Called by `buildBaseItem` in the main transformer.
 *
 * @module foundry/scripts/transformers/itemBuilders
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link buildWeaponItem} for attack features
 * @see {@link buildSaveFeatItem} for save-only features
 * @see {@link buildMultiattackItem} for multiattack features
 * @see {@link buildPassiveItem} for passive traits
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import {
    createAttackActivity,
    createCustomDamagePart,
    createDamagePart,
    createSaveActivity,
    createUtilityActivity,
} from '../constants/activityTemplates';
import type { DamageField, FoundryActivity } from '../handlers/types';
import type { FoundryItem } from './featureTransformer';
import { parseDamageFormula } from './featureTransformer';

/** @type {Record<string, string>} Maps MonsterFeature triggers to dnd5e activation types. */
const TRIGGER_MAP: Record<string, string> = {
  action: 'action',
  bonus_action: 'bonus',
  reaction: 'reaction',
  passive: 'none',
  free: 'none',
};

/** @type {DamageField} Empty DamageField with all required dnd5e 5.3 properties. */
const EMPTY_DAMAGE_FIELD: DamageField = {
  number: null,
  denomination: null,
  bonus: '',
  types: [],
  custom: { enabled: false, formula: '' },
};

/**
 * Resolves the dnd5e activation type from a MonsterFeature.
 *
 * @param {MonsterFeature} feature - Source feature
 * @returns {string} dnd5e activation type string
 */
function resolveActivation(feature: MonsterFeature): string {
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
function activation(type: string) {
  return {
    type,
    value: type !== 'none' ? 1 : null,
    condition: '',
    override: false,
  };
}

/**
 * Builds a slug-style identifier from a feature name.
 *
 * @param {string} name - Feature display name
 * @returns {string} Kebab-case identifier
 */
function toIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Builds module flags for a feature.
 *
 * @param {MonsterFeature} feature - Source feature
 * @returns {Record<string, unknown>} Flags block
 */
function buildFlags(feature: MonsterFeature): Record<string, unknown> {
  return {
    'ikuisuus-damocles': { featureId: feature.id, ...(feature.meta ?? {}) },
  };
}

/**
 * Builds the uses/recovery block for features with recharge.
 *
 * @param {MonsterFeature} feature - Feature with recharge data
 * @returns {Record<string, unknown>} dnd5e uses block
 */
function buildUses(feature: MonsterFeature): Record<string, unknown> {
  const r = feature.recharge!;
  return {
    spent: 0,
    max: '1',
    recovery: [
      {
        period: 'recharge',
        formula: r.min === r.max ? `${r.min}` : `${r.min}-${r.max}`,
      },
    ],
  };
}

/**
 * Converts a damage formula to a DamageField.
 *
 * @param {string} formula - Dice formula
 * @param {string} type - Damage type key
 * @returns {DamageField} Populated DamageField
 */
function toDamageField(formula: string, type: string): DamageField {
  const p = parseDamageFormula(formula);
  return {
    number: p?.count ?? null,
    denomination: p?.sides ?? null,
    bonus: p?.bonus ?? '',
    types: type ? [type] : [],
    custom: { enabled: !p, formula: p ? '' : formula },
  };
}

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
