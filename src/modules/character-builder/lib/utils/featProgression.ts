/**
 * @fileoverview Derives earned and remaining feat slots per Damocles progression
 * rules (`src/content/en/rules/the-measure-of-the-self/character-progression.mdx`):
 * one extra feat per tier-bonus increase (`computeTierBonus(level) - 1`), plus a
 * feat/ASI at each vocation's listed levels. <br />An ASI and a feat occupy the
 * same slot: "Ability Score Improvement" is one feat option.
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
 * feature table. Most vocations label the row "Feat"; wizard and monk's level-4
 * row label it "Ability Score Improvement".
 */
const ASI_FEATURE_NAMES = new Set(['feat', 'ability score improvement']);

/**
 * Counts the global tier-transition feats a character has earned at the given
 * total level: one per tier-bonus increase, i.e. `computeTierBonus(level) - 1`
 * (0 at levels 1–3, 1 at 4–6, up to 9 at 28–30). Granted to every character
 * regardless of vocation.
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
 * each vocation's own level, by reading the "Feat" or "Ability Score
 * Improvement" rows already stored on each vocation entry's feature shards.
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
 * Total feat slots a character has earned: global tier-transition feats plus
 * every vocation's feat/ASI rows.
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
 * Feat slots a character has earned but not yet filled from the feats list,
 * clamped at 0. Advisory only — it never blocks over-selection.
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
