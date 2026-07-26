/**
 * @fileoverview Character Derivation Utilities
 * @description The single authority for a character's level and tier bonus,
 * plus the XP progress block used by the header XP bar.
 *
 * `character.level` and `character.tierBonus` are derived *caches*, never
 * inputs: {@link getTotalCharacterLevel} and {@link getCharacterTierBonus}
 * define them, and every writer — the active-sheet reducer, the roster reducer,
 * the formula scope, hp grants — recomputes through these two functions so the
 * cache can never disagree with the derivation or with another writer. Nothing
 * else may define what "level" means.
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
 * Sums the `level` of every vocation entry carrying a non-empty slug. Slots
 * without a slug contribute 0.
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
 * THE definition of a character's level: the greater of the level their
 * experience buys and the levels they have allocated to vocations, clamped to
 * `[1, MAX_XP_LEVEL]`.
 *
 * Both writers keep `experience` at or above the vocation-sum floor, so for any
 * character that has been through a reducer the two terms agree and this is
 * simply the XP level; the vocation term is what stops un-normalized input from
 * reporting a level below the one its vocations already spend.
 *
 * The stored `character.level` is consulted only when there is no other signal
 * at all — no experience and no vocations — which is the shape of saves written
 * before `experience` existed. Reading the cache is otherwise forbidden here:
 * this function produces that cache, and letting it feed back in would let a
 * stale value perpetuate itself and outvote a genuine XP reduction.
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
 * THE definition of a character's tier bonus: the progression table applied to
 * {@link getTotalCharacterLevel}. Every writer of `character.tierBonus` must go
 * through here so the cache cannot drift from the level it is derived from.
 *
 * @function getCharacterTierBonus
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Tier bonus for the character's derived level
 */
export function getCharacterTierBonus(character: CharacterSheet): number {
  return computeTierBonus(getTotalCharacterLevel(character));
}

/**
 * Returns the sum of `level` across vocation entries with a non-empty slug.
 *
 * @function getVocationLevelSum
 * @param {CharacterSheet} character - Character sheet to inspect
 * @returns {number} Total allocated vocation level (0 when no slugs set)
 */
export function getVocationLevelSum(character: CharacterSheet): number {
  return sumVocationLevels(character.vocations);
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
