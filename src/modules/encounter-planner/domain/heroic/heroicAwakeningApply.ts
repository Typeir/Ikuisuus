/**
 * @fileoverview Random Heroic Awakening Application
 * @description Fate die rolling, affix determination, and tier resolution
 * for random heroic awakening applied during combat creation.
 *
 * @module heroicAwakeningApply
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { AffixEntry } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import type {
  HeroicAwakeningState,
  InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import {
  getAffixFromRoll,
  getAffixLink,
  getHeroicDc,
  maximizeHitDice,
  rollAffix,
} from '../mechanics/combatMechanics';

/**
 * Roll a d20 for fate die
 *
 * @function rollFateDie
 * @returns {number} Result 1–20
 */
const rollFateDie = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

/**
 * Roll affixes and determine awakening tier.
 * Each d10 roll of 10 ("Reroll") upgrades the tier and grants another roll.
 *
 * @function rollAffixesAndDetermineTier
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {HeroicAwakeningState} Object with tier, affixes, and bonuses
 */
const rollAffixesAndDetermineTier = (
  locale: string = 'en',
): HeroicAwakeningState => {
  let tier: 'awakened' | 'legendary' | 'mythic' = 'awakened';
  let affixCount = 1;
  let bonuses = { tier: 1, ac: 1, savingThrow: 1, hpPerCr: 0 };

  const affixes: AffixEntry[] = [];
  const usedAffixNames = new Set<string>();

  for (let i = 0; i < affixCount; i++) {
    let affixRoll = rollAffix();
    let affixName = getAffixFromRoll(affixRoll);

    while (affixName === 'Reroll') {
      if (tier === 'awakened') {
        tier = 'legendary';
        affixCount = 2;
        bonuses = { tier: 2, ac: 2, savingThrow: 2, hpPerCr: 2 };
      } else if (tier === 'legendary') {
        tier = 'mythic';
        affixCount = 3;
        bonuses = { tier: 3, ac: 3, savingThrow: 3, hpPerCr: 3 };
      }
      affixRoll = rollAffix();
      affixName = getAffixFromRoll(affixRoll);
    }

    if (!usedAffixNames.has(affixName)) {
      usedAffixNames.add(affixName);
      affixes.push({
        text: affixName,
        source: {
          slug: affixName.toLowerCase().replace(/\s+/g, '-'),
          href: getAffixLink(affixName, locale),
        },
      });
    } else {
      i--;
    }
  }

  return {
    tier,
    affixes,
    bonuses: {
      tierBonus: bonuses.proficiency,
      acBonus: bonuses.ac,
      savingThrowBonus: bonuses.savingThrow,
    },
    hpOverride: null,
    fateDieResult:
      10 + (tier === 'legendary' ? 5 : tier === 'mythic' ? 10 : 0),
    heroicDc: 15,
    awakened: true,
  };
};

/**
 * Apply Heroic Awakening to a single combatant.
 * Runs exactly once per combat snapshot at creation.
 *
 * @function applyHeroicAwakening
 * @param {InProgressCombatant} combatant - The combatant to awaken (mutated in place)
 * @param {string} [crText] - CR text like "CR 5" (skips awakening if not provided)
 * @param {string} [locale='en'] - Locale for affix wiki links
 */
export const applyHeroicAwakening = (
  combatant: InProgressCombatant,
  crText?: string,
  locale: string = 'en',
): void => {
  if (!crText) {
    combatant.heroicAwakening.tier = 'none';
    return;
  }

  const crMatch = crText.match(/(\d+)/);
  const cr = crMatch ? parseInt(crMatch[1], 10) : 0;
  const heroicDc = getHeroicDc(cr);

  const fateDieResult = rollFateDie();

  combatant.heroicAwakening.fateDieResult = fateDieResult;
  combatant.heroicAwakening.heroicDc = heroicDc;

  if (fateDieResult < heroicDc) {
    combatant.heroicAwakening.awakened = false;
    combatant.heroicAwakening.tier = 'none';
    return;
  }

  combatant.heroicAwakening.awakened = true;

  maximizeHitDice(combatant);

  const result = rollAffixesAndDetermineTier(locale);

  combatant.heroicAwakening.affixes = result.affixes.slice(0, 3);
  combatant.heroicAwakening.tier = result.tier;

  combatant.heroicAwakening.bonuses.tierBonus =
    result.bonuses.tierBonus;
  combatant.heroicAwakening.bonuses.acBonus = result.bonuses.acBonus;
  combatant.heroicAwakening.bonuses.savingThrowBonus =
    result.bonuses.savingThrowBonus;

  if (combatant.tierBonus !== null) {
    combatant.tierBonusOverride =
      combatant.tierBonus + result.bonuses.tierBonus;
  }

  combatant.ac += result.bonuses.acBonus;

  if (result.bonuses.tierBonus > 0 && combatant.hpMaxOverride !== null) {
    const hpBonus = result.bonuses.tierBonus * cr;
    combatant.hpMaxOverride = Math.max(
      combatant.hpMaxOverride + hpBonus,
      combatant.hpMax,
    );
    combatant.hpCurrent = combatant.hpMaxOverride;
  }
};
