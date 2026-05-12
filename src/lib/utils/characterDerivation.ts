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
} from './xpProgression';

/**
 * Derived XP / level block for a character.
 *
 * @interface CharacterDerived
 * @property {number} totalLevel - Sum of active vocation levels, or `character.level` if no vocations have a slug
 * @property {boolean} hasActiveVocations - True when at least one vocation entry has a non-empty slug
 * @property {number} experience - Effective experience (raised to `totalLevel`'s XP floor when needed)
 * @property {number} xpFloor - XP threshold for `totalLevel`
 * @property {number} xpCeiling - XP threshold for `totalLevel + 1` (or `XP_THRESHOLDS[MAX_XP_LEVEL]` at level 30)
 * @property {number} xpProgressPercent - Percent (0–100) toward the next level
 * @property {number} xpOverallPercent - Percent (0–100) of progress across the full 1→`MAX_XP_LEVEL` range
 */
export interface CharacterDerived {
  totalLevel: number;
  hasActiveVocations: boolean;
  experience: number;
  xpFloor: number;
  xpCeiling: number;
  xpProgressPercent: number;
  xpOverallPercent: number;
}

/**
 * Returns the total character level for the given sheet. For characters with
 * one or more active vocations (any vocation with a non-empty slug) this is
 * the sum of their `level` fields. Otherwise the stored `character.level`
 * value is used as a fallback.
 *
 * @function getTotalCharacterLevel
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Total character level (minimum 1)
 */
export function getTotalCharacterLevel(character: CharacterSheet): number {
  const active = character.vocations.filter((v) => Boolean(v.slug));
  if (active.length === 0) return Math.max(1, character.level ?? 1);
  const total = active.reduce((sum, v) => sum + (v.level ?? 1), 0);
  return Math.max(1, total);
}

/**
 * Derives the full XP / level display block for a character. The character's
 * stored `experience` is preserved when it already meets or exceeds the floor
 * for the derived total level; otherwise it is raised to that floor so the
 * XP bar never lags behind a manually entered level.
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
  const cappedLevel = Math.min(totalLevel, MAX_XP_LEVEL);
  const floor = getXPForLevel(cappedLevel);
  const ceilingLevel = Math.min(cappedLevel + 1, MAX_XP_LEVEL);
  const ceiling =
    cappedLevel >= MAX_XP_LEVEL
      ? XP_THRESHOLDS[MAX_XP_LEVEL]
      : getXPForLevel(ceilingLevel);

  const storedXp = character.experience ?? 0;
  const experience = Math.max(storedXp, floor);

  const xpProgressPercent =
    cappedLevel >= MAX_XP_LEVEL
      ? 100
      : Math.max(
          0,
          Math.min(100, Math.round(((experience - floor) / (ceiling - floor)) * 100)),
        );

  const xpOverallPercent = Math.max(
    0,
    Math.min(100, (experience / XP_THRESHOLDS[MAX_XP_LEVEL]) * 100),
  );

  return {
    totalLevel,
    hasActiveVocations,
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
