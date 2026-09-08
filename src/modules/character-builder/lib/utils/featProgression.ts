/**
 * @fileoverview Derives earned and remaining feat slots per Damocles progression
 * rules (`src/content/en/rules/the-measure-of-the-self/character-progression.mdx`)
 *
 * @module modules/character-builder/lib/utils/featProgression
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import { getTotalCharacterLevel } from './characterDerivation';
import { computeTierBonus } from './characterStorage';

/**
 * Lowercased feature-row names that denote a feat/ASI slot in a vocation's
 * feature table.
 */
const ASI_FEATURE_NAMES = new Set(['feat', 'ability score improvement']);

/**
 * Counts the global tier-transition feats a character has earned at the given
 * total level
 *
 * @function countGlobalTierFeats
 * @param {number} totalLevel - Global character level (1–30)
 * @returns {number} Extra feats granted by tier-bonus increases
 */
export function countGlobalTierFeats(totalLevel: number): number {
  return Math.max(0, computeTierBonus(totalLevel) - 1);
}

/**
 * Counts the feat/ASI slots a character's vocations have unlocked at or below
 * each vocation's own level
 *
 * @function countVocationAsiFeats
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Feat/ASI slots granted by vocation progression
 */
export function countVocationAsiFeats(character: CharacterSheet): number {
  return character.vocations.reduce((total, vocation) => {
    const earned = vocation.vocationFeatures.filter(
      (shard) =>
        ASI_FEATURE_NAMES.has((shard.heading ?? '').trim().toLowerCase()) &&
        shard.level !== undefined &&
        shard.level <= vocation.level,
    ).length;
    return total + earned;
  }, 0);
}

/**
 * Total feat slots a character has earned
 *
 * @function countEarnedFeats
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Earned feat slots
 */
export function countEarnedFeats(character: CharacterSheet): number {
  return (
    countGlobalTierFeats(getTotalCharacterLevel(character)) +
    countVocationAsiFeats(character)
  );
}

/**
 * Feat slots a character has earned but not yet filled from the feats list
 *
 * @function countUnspentFeats
 * @param {CharacterSheet} character - Character to inspect
 * @returns {number} Unspent feat slots
 */
export function countUnspentFeats(character: CharacterSheet): number {
  const earned = countEarnedFeats(character);
  const selected = character.selectedFeats?.length ?? 0;
  return Math.max(0, earned - selected);
}
