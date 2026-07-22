/**
 * @fileoverview Character Formula Scope
 * @description Flattens a {@link CharacterEntity} into a flat map of
 * primitive stats. This is the substitution scope that wiki MDX formulas
 * will resolve against (e.g. `{str.mod}` → `+3`) once formula replacement
 * lands in the library render pipeline. Kept as a pure derivation so the
 * scope can be rebuilt from the selected character on every render.
 *
 * @module modules/character-builder/lib/utils/characterFormulaScope
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterEntity } from '@/modules/character-builder/domain/character/characterEntity';
import { ABILITY_KEYS } from '@/modules/character-builder/domain/character/characterEntity';
import { getCharacterDerived } from './characterDerivation';
import { computeAbilityModifier, computeTierBonus } from './characterStorage';

/**
 * Flat map of primitive stat values keyed by dot-notation formula names.
 *
 * @typedef {Record<string, string | number>} CharacterFormulaScope
 */
export type CharacterFormulaScope = Record<string, string | number>;

/**
 * Build the flat formula-substitution scope for a character entity.
 * Every value is a primitive so the scope itself is plain JSON.
 *
 * @function getCharacterFormulaScope
 * @param {CharacterEntity} entity - Character to derive from
 * @returns {CharacterFormulaScope} Flat stat map, e.g. `{ 'str.mod': 3, level: 5 }`
 */
export const getCharacterFormulaScope = (
  entity: CharacterEntity,
): CharacterFormulaScope => {
  const derived = getCharacterDerived(entity);
  const scope: CharacterFormulaScope = {
    name: entity.name,
    level: derived.totalLevel,
    experience: derived.experience,
    tierBonus: computeTierBonus(derived.totalLevel),
    hpMax: entity.hpMax,
    hpCurrent: entity.hpCurrent,
    tempHp: entity.tempHp,
    ac: entity.ac,
    initiativeBonus: entity.initiativeBonus,
    gritCurrent: entity.gritCurrent,
    gritMax: entity.gritMax,
  };
  for (const key of ABILITY_KEYS) {
    const score = entity.abilityScores[key];
    scope[key] = score;
    scope[`${key}.mod`] = computeAbilityModifier(score);
  }
  return scope;
};
