/**
 * @fileoverview Derives a character's level, tier bonus, and XP progress block.
 * @description `character.level` and `character.tierBonus` are derived caches.
 * {@link getTotalCharacterLevel} and {@link getCharacterTierBonus} produce them;
 * all writers recompute through these two functions.
 *
 * @module modules/character-builder/lib/utils/characterDerivation
 * @version 2.0.0
 * @author Typeir
 * @since 5.0.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import { computeTierBonus } from './characterStorage';
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
 * Sums `level` of all vocation entries with a non-empty slug.
 *
 * @function sumVocationLevels
 * @param {VocationEntry[]} vocations - Vocation entries to total
 * @returns {number} Allocated vocation level (0 when no slugs set)
 */
export function sumVocationLevels(vocations: VocationEntry[]): number {
  return vocations
    .filter((v) => Boolean(v.slug))
    .reduce((sum, v) => sum + (v.level ?? 0), 0);
}

/**
 * Returns the character's level: max of XP-derived level, allocated vocation
 * level, and legacy `character.level`, clamped to `[1, MAX_XP_LEVEL]`.
 *
 * @function getTotalCharacterLevel
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Global character level (1–{@link MAX_XP_LEVEL})
 */
export function getTotalCharacterLevel(character: CharacterSheet): number {
  const xpLevel = getLevelFromXP(character.experience ?? 0);
  const vocationLevel = sumVocationLevels(character.vocations);
  const legacyLevel =
    (character.experience ?? 0) <= 0 && vocationLevel === 0
      ? (character.level ?? 1)
      : 1;
  return Math.min(
    MAX_XP_LEVEL,
    Math.max(1, xpLevel, vocationLevel, legacyLevel),
  );
}

/**
 * Returns the tier bonus from {@link getTotalCharacterLevel} via the
 * progression table.
 *
 * @function getCharacterTierBonus
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Tier bonus for the character's derived level
 */
export function getCharacterTierBonus(character: CharacterSheet): number {
  return computeTierBonus(getTotalCharacterLevel(character));
}

/**
 * Sums `level` across vocation entries with a non-empty slug.
 *
 * @function getVocationLevelSum
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Total allocated vocation level (0 when no slugs set)
 */
export function getVocationLevelSum(character: CharacterSheet): number {
  return sumVocationLevels(character.vocations);
}

/**
 * Returns the XP / level display block for a character. Does not mutate input.
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
 * Returns the level for the given XP via {@link getLevelFromXP}. Wrapper used
 * by the header XP input.
 *
 * @function getLevelFromXpInput
 * @param {number} xp - Total accumulated experience points
 * @returns {number} Character level (1–{@link MAX_XP_LEVEL})
 */
export function getLevelFromXpInput(xp: number): number {
  return getLevelFromXP(xp);
}
