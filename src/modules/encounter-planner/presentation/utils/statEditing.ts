/**
 * @fileoverview Stat Editing Utilities
 * @description Shared utilities for parsing and formatting combat stat values.
 * Used by combatant stat editors across the encounter planner.
 *
 * @module statEditing
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Parses a string to an integer with validation.
 * Returns null for empty strings when allowEmpty is true, 0 for NaN results.
 *
 * @function parseIntSafe
 * @param {string} value - String to parse
 * @param {boolean} [allowEmpty=false] - Whether empty string returns null
 * @returns {number | null} Parsed integer or null
 */
export const parseIntSafe = (
  value: string,
  allowEmpty = false,
): number | null => {
  if (value === '' && allowEmpty) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Clamps a value to a minimum of 0 (no negative values).
 *
 * @function clampNonNegative
 * @param {number | null} value - Value to clamp
 * @returns {number | null} Clamped value or null
 */
export const clampNonNegative = (value: number | null): number | null => {
  if (value === null) return null;
  return Math.max(0, value);
};

/**
 * Computes the modifier string for an ability score.
 *
 * @function getModifierString
 * @param {number} score - Ability score (1-30)
 * @returns {string} Modifier string (e.g., "+2" or "-1")
 */
import { formatModifier } from '@/lib/utils/formatModifier';

export const getModifierString = (score: number): string => {
  const mod = Math.floor((score - 10) / 2);
  return formatModifier(mod);
};
