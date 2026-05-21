/**
 * @fileoverview Shared utility functions for Foundry item builders.
 * @description Common helpers for identifier generation, flags, uses/recovery,
 * and damage field conversion.
 *
 * @module foundry/scripts/transformers/itemBuilders/utils
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import type { DamageField } from '../handlers/types';
import { parseDamageFormula } from './featureTransformer';

/** @type {DamageField} Empty DamageField with all required dnd5e 5.3 properties. */
export const EMPTY_DAMAGE_FIELD: DamageField = {
  number: null,
  denomination: null,
  bonus: '',
  types: [],
  custom: { enabled: false, formula: '' },
};

/**
 * Builds a slug-style identifier from a feature name.
 *
 * @param {string} name - Feature display name
 * @returns {string} Kebab-case identifier
 */
export function toIdentifier(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Builds module flags for a feature.
 *
 * @param {MonsterFeature} feature - Source feature
 * @returns {Record<string, unknown>} Flags block
 */
export function buildFlags(feature: MonsterFeature): Record<string, unknown> {
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
export function buildUses(feature: MonsterFeature): Record<string, unknown> {
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
export function toDamageField(formula: string, type: string): DamageField {
  const p = parseDamageFormula(formula);
  return {
    number: p?.count ?? null,
    denomination: p?.sides ?? null,
    bonus: p?.bonus ?? '',
    types: type ? [type] : [],
    custom: { enabled: !p, formula: p ? '' : formula },
  };
}
