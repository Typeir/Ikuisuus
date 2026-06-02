/**
 * @fileoverview Carrying Capacity Domain Types
 * @description Type definitions for carrying capacity calculations.
 *
 * @module modules/character-builder/domain/carrying-capacity/types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Possible creature size categories used by the calculator.
 *
 * @typedef {'fine'|'diminutive'|'tiny'|'small'|'medium'|'large'|'huge'|'gargantuan'|'colossal'} CreatureSize
 */
export type CreatureSize =
  | 'fine'
  | 'diminutive'
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'gargantuan'
  | 'colossal';

/**
 * Light / medium / heavy thresholds in pounds.
 *
 * @interface CapacityThresholds
 * @property {number} light - Maximum weight at light load
 * @property {number} medium - Maximum weight at medium load
 * @property {number} heavy - Maximum weight at heavy load
 */
export interface CapacityThresholds {
  light: number;
  medium: number;
  heavy: number;
}
