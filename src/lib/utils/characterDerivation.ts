/**
 * @fileoverview Character Derivation Utilities
 * @description Pure helpers that derive secondary values from a
 * {@link CharacterSheet}: total character level (sum of active vocation
 * levels), and the XP progress block used by the header XP bar.
 *
 * These helpers are the single source of truth for level / XP display.
 * The persisted `character.level` and `character.experience` fields are
 * inputs only — UI must always render the derived block returned here.
 *
 * @module lib/utils/characterDerivation
 * @version 1.0.0
 * @author Typeir
 * @since 5.0.0
 */

import type { CharacterSheet } from '../types/character';
import {
    MAX_XP_LEVEL,
    XP_THRESHOLDS,
    getLevelFromXP,
    getXPForLevel,
    getXpAxisPosition,
} from './xpProgression';

/**
 * Derived XP / level block for a character.
 *
 * @interface CharacterDerived
 * @property {number} totalLevel - Character level derived from `character.experience` via {@link getLevelFromXP} (the global level)
 * @property {boolean} hasActiveVocations - True when at least one vocation entry has a non-empty slug
 * @property {number} vocationLevel - Sum of `level` across vocations with a non-empty slug (the allocated level)
 * @property {number} unassignedLevels - `max(0, totalLevel - vocationLevel)` — global level points the user has not yet allocated to a vocation
 * @property {boolean} hasUnassignedLevels - Convenience flag `unassignedLevels > 0`
 * @property {number} experience - The character's stored experience (no clamping)
 * @property {number} xpFloor - XP threshold for `totalLevel`
 * @property {number} xpCeiling - XP threshold for `totalLevel + 1` (or `XP_THRESHOLDS[MAX_XP_LEVEL]` at level 30)
 * @property {number} xpProgressPercent - Percent (0–100) toward the next level
 * @property {number} xpOverallPercent - Power-law position (0–100) across the full 0→`XP_THRESHOLDS[MAX_XP_LEVEL]` axis
 */
export interface CharacterDerived {
  totalLevel: number;
  hasActiveVocations: boolean;
  vocationLevel: number;
  unassignedLevels: number;
  hasUnassignedLevels: boolean;
  experience: number;
  xpFloor: number;
  xpCeiling: number;
  xpProgressPercent: number;
  xpOverallPercent: number;
}

/**
 * Returns the global character level derived from the stored `experience`
 * value. Falls back to the stored `character.level` when `experience` is
 * missing or zero (so newly-created characters keep their displayed level
 * until they earn their first XP).
 *
 * @function getTotalCharacterLevel
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Global character level (1–{@link MAX_XP_LEVEL})
 */
export function getTotalCharacterLevel(character: CharacterSheet): number {
  const xp = character.experience ?? 0;
  if (xp <= 0) return Math.max(1, character.level ?? 1);
  return Math.min(MAX_XP_LEVEL, Math.max(1, getLevelFromXP(xp)));
}

/**
 * Returns the sum of `level` across vocation entries with a non-empty slug.
 * Vocation slots without a slug contribute 0.
 *
 * @function getVocationLevelSum
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Total allocated vocation level (0 when no slugs set)
 */
export function getVocationLevelSum(character: CharacterSheet): number {
  return character.vocations
    .filter((v) => Boolean(v.slug))
    .reduce((sum, v) => sum + (v.level ?? 0), 0);
}

/**
 * Derives the full XP / level display block for a character. The character's
 * stored `experience` is preserved verbatim — this function never mutates
 * input values, it only computes display-time derivations.
 *
 * @function getCharacterDerived
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {CharacterDerived} Derived display block
 */
export function getCharacterDerived(
  character: CharacterSheet,
): CharacterDerived {
  const totalLevel = getTotalCharacterLevel(character);
  const hasActiveVocations = character.vocations.some((v) => Boolean(v.slug));
  const vocationLevel = getVocationLevelSum(character);
  const unassignedLevels = Math.max(0, totalLevel - vocationLevel);
  const hasUnassignedLevels = unassignedLevels > 0;
  const cappedLevel = Math.min(totalLevel, MAX_XP_LEVEL);
  const floor = getXPForLevel(cappedLevel);
  const ceilingLevel = Math.min(cappedLevel + 1, MAX_XP_LEVEL);
  const ceiling =
    cappedLevel >= MAX_XP_LEVEL
      ? XP_THRESHOLDS[MAX_XP_LEVEL]
      : getXPForLevel(ceilingLevel);

  const experience = character.experience ?? 0;

  const xpProgressPercent =
    cappedLevel >= MAX_XP_LEVEL
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(((experience - floor) / (ceiling - floor)) * 100),
          ),
        );

  const xpOverallPercent = getXpAxisPosition(experience);

  return {
    totalLevel,
    hasActiveVocations,
    vocationLevel,
    unassignedLevels,
    hasUnassignedLevels,
    experience,
    xpFloor: floor,
    xpCeiling: ceiling,
    xpProgressPercent,
    xpOverallPercent,
  };
}

/**
 * Returns the canonical character level corresponding to the given XP value
 * when no vocations are active. Convenience wrapper around
 * {@link getLevelFromXP} used by the header XP input.
 *
 * @function getLevelFromXpInput
 * @param {number} xp - Total accumulated experience points
 * @returns {number} Character level (1–{@link MAX_XP_LEVEL})
 */
export function getLevelFromXpInput(xp: number): number {
  return getLevelFromXP(xp);
}
