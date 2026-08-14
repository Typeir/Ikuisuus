/**
 * @fileoverview Carrying Capacity Constants
 * @description Domain constants and lookup tables for carrying capacity calculations.
 *
 * @module modules/character-builder/domain/carrying-capacity/constants
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CapacityThresholds, CreatureSize } from './types';

/**
 * d20 SRD carrying capacity table for STR 1-29.
 *
 * @constant STR_TABLE
 */
export const STR_TABLE: Record<number, CapacityThresholds> = {
  1: { light: 3, medium: 6, heavy: 10 },
  2: { light: 6, medium: 13, heavy: 20 },
  3: { light: 10, medium: 20, heavy: 30 },
  4: { light: 13, medium: 26, heavy: 40 },
  5: { light: 16, medium: 33, heavy: 50 },
  6: { light: 20, medium: 40, heavy: 60 },
  7: { light: 23, medium: 46, heavy: 70 },
  8: { light: 26, medium: 53, heavy: 80 },
  9: { light: 30, medium: 60, heavy: 90 },
  10: { light: 33, medium: 66, heavy: 100 },
  11: { light: 38, medium: 76, heavy: 115 },
  12: { light: 43, medium: 86, heavy: 130 },
  13: { light: 50, medium: 100, heavy: 150 },
  14: { light: 58, medium: 116, heavy: 175 },
  15: { light: 66, medium: 133, heavy: 200 },
  16: { light: 76, medium: 153, heavy: 230 },
  17: { light: 86, medium: 173, heavy: 260 },
  18: { light: 100, medium: 200, heavy: 300 },
  19: { light: 116, medium: 233, heavy: 350 },
  20: { light: 133, medium: 266, heavy: 400 },
  21: { light: 153, medium: 306, heavy: 460 },
  22: { light: 173, medium: 346, heavy: 520 },
  23: { light: 200, medium: 400, heavy: 600 },
  24: { light: 233, medium: 466, heavy: 700 },
  25: { light: 266, medium: 533, heavy: 800 },
  26: { light: 306, medium: 613, heavy: 920 },
  27: { light: 346, medium: 693, heavy: 1040 },
  28: { light: 400, medium: 800, heavy: 1200 },
  29: { light: 466, medium: 933, heavy: 1400 },
};

/**
 * Bipedal size multipliers relative to Medium = 1.
 *
 * @constant SIZE_MULTIPLIERS
 */
export const SIZE_MULTIPLIERS: Record<CreatureSize, number> = {
  fine: 1 / 8,
  diminutive: 1 / 4,
  tiny: 1 / 2,
  small: 3 / 4,
  medium: 1,
  large: 2,
  huge: 4,
  gargantuan: 8,
  colossal: 16,
};

/**
 * Quadruped size multipliers (replaces bipedal multiplier when the creature is
 * a quadruped). Sizes smaller than Medium use the bipedal multiplier.
 *
 * @constant QUADRUPED_MULTIPLIERS
 */
export const QUADRUPED_MULTIPLIERS: Partial<Record<CreatureSize, number>> = {
  medium: 1.5,
  large: 3,
  huge: 6,
  gargantuan: 12,
  colossal: 24,
};

/**
 * Speed and skill penalties applied at each load tier.
 *
 * @constant LOAD_PENALTIES
 */
export const LOAD_PENALTIES = {
  light: {
    maxDex: null as number | null,
    checkPenalty: 0,
    runMultiplier: 4,
    speedReduction: false,
  },
  medium: {
    maxDex: 3,
    checkPenalty: -3,
    runMultiplier: 4,
    speedReduction: true,
  },
  heavy: {
    maxDex: 1,
    checkPenalty: -6,
    runMultiplier: 3,
    speedReduction: true,
  },
};
