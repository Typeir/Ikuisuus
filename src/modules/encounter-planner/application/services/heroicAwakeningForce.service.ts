/**
 * @fileoverview Force Heroic Awakening Utilities
 * @description Functions for manually forcing heroic awakening tiers on combatants,
 * either by tier selection or by explicit affix list.
 *
 * @module heroicAwakeningForce
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { AffixEntry } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import {
  generateUniqueAffixes,
  getHeroicDc,
  maximizeHitDice,
} from '../../domain/mechanics/combatMechanics';

/**
 * Undo previous awakening stat bonuses from a combatant.
 *
 * @function undoPreviousAwakeningBonuses
 * @param {InProgressCombatant} combatant - The combatant (mutated in place)
 * @param {number} cr - Numeric challenge rating
 */
const undoPreviousAwakeningBonuses = (
  combatant: InProgressCombatant,
  cr: number,
): void => {
  if (!combatant.heroicAwakening.awakened) return;

  const previousTier = combatant.heroicAwakening.tier;
  const previousMultiplier =
    previousTier === 'mythic' ? 3 : previousTier === 'legendary' ? 2 : 1;

  combatant.ac -= previousMultiplier;
  combatant.hpMax -= previousMultiplier * cr;

  if (
    combatant.proficiencyBonus !== null &&
    combatant.proficiencyBonusOverride !== null
  ) {
    combatant.proficiencyBonusOverride -= previousMultiplier;
  }
};

/**
 * Apply awakening stat bonuses to a combatant.
 *
 * @function applyAwakeningBonuses
 * @param {InProgressCombatant} combatant - The combatant (mutated in place)
 * @param {number} tierMultiplier - Tier multiplier (1=awakened, 2=legendary, 3=mythic)
 * @param {number} cr - Numeric challenge rating
 */
const applyAwakeningBonuses = (
  combatant: InProgressCombatant,
  tierMultiplier: number,
  cr: number,
): void => {
  if (combatant.proficiencyBonus !== null) {
    combatant.proficiencyBonusOverride =
      combatant.proficiencyBonus + tierMultiplier;
  }

  combatant.ac += tierMultiplier;
  combatant.hpMax += tierMultiplier * cr;

  if (combatant.hpFormula) {
    maximizeHitDice(combatant);
  }

  const finalMaxHP = Math.max(combatant.hpMaxOverride ?? 0, combatant.hpMax);
  combatant.hpCurrent = finalMaxHP;
};

/**
 * Parse CR number from crText string.
 *
 * @function parseCr
 * @param {string} crText - CR text like "CR 5"
 * @returns {number} Parsed CR number, or 0 if not parseable
 */
const parseCr = (crText: string): number => {
  const crMatch = crText.match(/(\d+)/);
  return crMatch ? parseInt(crMatch[1], 10) : 0;
};

/**
 * Force a specific heroic awakening tier on a combatant.
 * Undoes previous bonuses before applying new ones to prevent stacking.
 *
 * @function forceHeroicAwakening
 * @param {InProgressCombatant} combatant - The combatant to awaken (mutated in place)
 * @param {'awakened'|'legendary'|'mythic'} tier - Target tier to force
 * @param {string} [locale='en'] - Locale for affix wiki links
 */
export const forceHeroicAwakening = (
  combatant: InProgressCombatant,
  tier: 'awakened' | 'legendary' | 'mythic',
  locale: string = 'en',
): void => {
  const crText = combatant.crText;
  if (!crText) return;

  const cr = parseCr(crText);
  const tierMultiplier = tier === 'mythic' ? 3 : tier === 'legendary' ? 2 : 1;
  const affixCount = tierMultiplier;

  undoPreviousAwakeningBonuses(combatant, cr);

  combatant.heroicAwakening = {
    awakened: true,
    tier,
    fateDieResult: tier === 'mythic' ? 20 : tier === 'legendary' ? 15 : 10,
    heroicDc: getHeroicDc(cr),
    bonuses: {
      proficiencyBonus: tierMultiplier,
      acBonus: tierMultiplier,
      savingThrowBonus: tierMultiplier,
    },
    affixes: generateUniqueAffixes(affixCount, locale),
    hpOverride: combatant.heroicAwakening.hpOverride,
  };

  applyAwakeningBonuses(combatant, tierMultiplier, cr);
};

/**
 * Determine awakening tier from affix count.
 *
 * @function getTierFromAffixCount
 * @param {number} count - Number of affixes
 * @returns {'none'|'awakened'|'legendary'|'mythic'} Resolved tier
 */
const getTierFromAffixCount = (
  count: number,
): 'none' | 'awakened' | 'legendary' | 'mythic' => {
  if (count >= 3) return 'mythic';
  if (count === 2) return 'legendary';
  if (count === 1) return 'awakened';
  return 'none';
};

/**
 * Force heroic awakening with explicit user-selected affixes.
 * Undoes previous bonuses, infers tier from affix count, and applies stat bonuses.
 * If no affixes are provided, removes the awakening entirely.
 *
 * @function forceHeroicAwakeningWithAffixes
 * @param {InProgressCombatant} combatant - The combatant to awaken (mutated in place)
 * @param {AffixEntry[]} affixes - User-selected affix entries
 */
export const forceHeroicAwakeningWithAffixes = (
  combatant: InProgressCombatant,
  affixes: AffixEntry[],
): void => {
  const crText = combatant.crText;
  if (!crText) return;

  const cr = parseCr(crText);
  const tier = getTierFromAffixCount(affixes.length);

  undoPreviousAwakeningBonuses(combatant, cr);

  if (tier === 'none') {
    combatant.heroicAwakening = {
      fateDieResult: 0,
      heroicDc: 0,
      awakened: false,
      tier: 'none',
      affixes: [],
      bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
      hpOverride: combatant.heroicAwakening.hpOverride,
    };
    return;
  }

  const tierMultiplier = tier === 'mythic' ? 3 : tier === 'legendary' ? 2 : 1;

  combatant.heroicAwakening = {
    awakened: true,
    tier,
    fateDieResult: tier === 'mythic' ? 20 : tier === 'legendary' ? 15 : 10,
    heroicDc: getHeroicDc(cr),
    bonuses: {
      proficiencyBonus: tierMultiplier,
      acBonus: tierMultiplier,
      savingThrowBonus: tierMultiplier,
    },
    affixes: affixes.map((a) => ({ ...a })),
    hpOverride: combatant.heroicAwakening.hpOverride,
  };

  applyAwakeningBonuses(combatant, tierMultiplier, cr);
};
