/**
 * @fileoverview Carrying Capacity Calculations
 * @description Implementation for computing carrying capacity thresholds.
 *
 * @module modules/character-builder/infrastructure/carrying-capacity
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    QUADRUPED_MULTIPLIERS,
    SIZE_MULTIPLIERS,
    STR_TABLE,
    type CapacityThresholds,
    type CreatureSize,
} from '@/modules/character-builder/domain/carrying-capacity';

/**
 * Computes carrying capacity thresholds for a given Strength score, size, and
 * bipedal/quadruped status.
 *
 * @function computeCapacity
 * @param {number} strength - Character Strength score (>= 1)
 * @param {CreatureSize} [size] - Creature size; defaults to `'medium'`
 * @param {boolean} [isQuadruped] - True for quadruped creatures
 * @returns {CapacityThresholds} Light / medium / heavy thresholds in pounds
 */
export const computeCapacity = (
  strength: number,
  size: CreatureSize = 'medium',
  isQuadruped: boolean = false,
): CapacityThresholds => {
  if (strength < 1) {
    return { light: 0, medium: 0, heavy: 0 };
  }

  let baseStrength = strength;
  let multiplier = 1;
  while (baseStrength > 29) {
    baseStrength -= 10;
    multiplier *= 4;
  }
  const base = STR_TABLE[baseStrength] ?? STR_TABLE[10];

  const sizeMultiplier =
    isQuadruped && QUADRUPED_MULTIPLIERS[size] !== undefined
      ? (QUADRUPED_MULTIPLIERS[size] as number)
      : SIZE_MULTIPLIERS[size];

  const total = multiplier * sizeMultiplier;

  return {
    light: Math.floor(base.light * total),
    medium: Math.floor(base.medium * total),
    heavy: Math.floor(base.heavy * total),
  };
};
