/**
 * @fileoverview Combat Mechanics Utilities
 * @description Heroic Awakening system: fate die rolling, affix generation,
 * tier resolution, and HP maximization for in-progress combatants.
 *
 * @module combatMechanics
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { AffixEntry } from '@/lib/types/encounterPlanner';
import type {
    CombatantMechanics,
    HeroicAwakeningState,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';

/**
 * Map CR to heroic DC threshold
 *
 * @param {(string | number)} cr - Challenge rating
 * @returns {number} DC threshold (15–19)
 */
export const getHeroicDc = (cr: string | number): number => {
  const crNum = typeof cr === 'string' ? parseInt(cr, 10) : cr;
  if (crNum <= 5) return 15;
  if (crNum <= 10) return 16;
  if (crNum <= 15) return 17;
  if (crNum <= 20) return 18;
  return 19;
};

/**
 * Get affix name from d10 roll (1–9 = affix, 10 = "Reroll")
 *
 * @param {number} roll - D10 roll result (1–10)
 * @returns {string} Affix name or "Reroll"
 */
const getAffixFromRoll = (roll: number): string => {
  const affixes = [
    '',
    'Bloodthirsty',
    'Championed',
    'Crusading',
    'Flametongued',
    'Frostveined',
    'Psionic',
    'Rakish',
    'Stormbound',
    'Sulphurous',
  ];
  return affixes[roll] || 'Reroll';
};

/**
 * Get wiki link for a heroic affix
 *
 * @param {string} affixName - Affix display name
 * @param {string} [locale='en'] - Locale for URL
 * @returns {string} Wiki link path
 */
const getAffixLink = (affixName: string, locale: string = 'en'): string => {
  const slug = affixName.toLowerCase().replace(/\s+/g, '-');
  return `/${locale}/library/rules/heroic-awakening/${slug}`;
};

/**
 * Roll a d20 for fate die
 *
 * @returns {number} Result 1–20
 */
const rollFateDie = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

/**
 * Roll d10 for affix selection
 *
 * @returns {number} Result 1–10
 */
const rollAffix = (): number => {
  return Math.floor(Math.random() * 10) + 1;
};

/**
 * Parse mechanics flags from creature tags array
 *
 * @param {string[]} [tags] - Array of metadata tags (e.g., ['mechanic:lair', 'mechanic:stratagem'])
 * @returns {CombatantMechanics} Object with boolean flags
 */
export const parseMechanicsFromTags = (tags?: string[]): CombatantMechanics => {
  if (!tags || !Array.isArray(tags)) {
    return {
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    };
  }

  return {
    lair: tags.includes('mechanic:lair'),
    stratagem: tags.includes('mechanic:stratagem'),
    legendaryDeed: tags.includes('mechanic:legendary-deed'),
    resist: tags.includes('mechanic:resist'),
    phase: tags.includes('mechanic:phase'),
  };
};

/**
 * Get default number of resist uses based on CR.
 * Returns 3 (D&D 5e standard for legendary resistances).
 *
 * @function getDefaultResistCount
 * @param {string} [_crText] - CR text (currently unused, reserved for future scaling)
 * @returns {number} Default resist count (3)
 */
export const getDefaultResistCount = (_crText?: string): number => {
  return 3;
};

/**
 * Get default number of legendary deeds based on CR.
 * Returns 3 (D&D 5e standard for legendary actions per round).
 *
 * @function getDefaultDeedCount
 * @param {string} [_crText] - CR text (currently unused, reserved for future scaling)
 * @returns {number} Default deed count (3)
 */
export const getDefaultDeedCount = (_crText?: string): number => {
  return 3;
};

/**
 * Maximize hit dice for a combatant based on their HP formula.
 * If formula exists: parses "NdM" and calculates N*M + constant.
 * If formula missing: uses percentage-based approach.
 *
 * @function maximizeHitDice
 * @param {InProgressCombatant} combatant - The combatant to maximize HP for (mutated in place)
 */
const maximizeHitDice = (combatant: InProgressCombatant): void => {
  const conMod = Math.floor((combatant.stats.con - 10) / 2);

  if (combatant.hpFormula) {
    const diceMatch = combatant.hpFormula.match(/(\d+)d(\d+)/);

    if (diceMatch) {
      const diceCount = parseInt(diceMatch[1], 10);
      const dieSize = parseInt(diceMatch[2], 10);
      const baseHP = diceCount * dieSize + diceCount * Math.max(conMod, 1);

      const constantMatch = combatant.hpFormula.match(/\+\s*(\d+)$/);
      const additionalConstant = constantMatch
        ? parseInt(constantMatch[1], 10)
        : 0;

      combatant.hpMaxOverride = baseHP + additionalConstant;
      combatant.hpCurrent = combatant.hpMaxOverride;
      return;
    }
  }

  const estimatedMaximized = Math.max(
    combatant.hpMax * 2,
    combatant.hpMax + Math.round(combatant.hpMax * 0.5),
  );

  combatant.hpMaxOverride = estimatedMaximized;
  combatant.hpCurrent = combatant.hpMaxOverride;
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
  let bonuses = { proficiency: 1, ac: 1, savingThrow: 1, hpPerCr: 0 };

  const affixes: AffixEntry[] = [];
  const usedAffixNames = new Set<string>();

  for (let i = 0; i < affixCount; i++) {
    let affixRoll = rollAffix();
    let affixName = getAffixFromRoll(affixRoll);

    while (affixName === 'Reroll') {
      if (tier === 'awakened') {
        tier = 'legendary';
        affixCount = 2;
        bonuses = { proficiency: 2, ac: 2, savingThrow: 2, hpPerCr: 2 };
      } else if (tier === 'legendary') {
        tier = 'mythic';
        affixCount = 3;
        bonuses = { proficiency: 3, ac: 3, savingThrow: 3, hpPerCr: 3 };
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
      proficiencyBonus: bonuses.proficiency,
      acBonus: bonuses.ac,
      savingThrowBonus: bonuses.savingThrow,
    },
    hpOverride: null,
    fateDieResult: 10 + (tier === 'legendary' ? 5 : tier === 'mythic' ? 10 : 0),
    heroicDc: 15,
    awakened: true,
  };
};

/**
 * Generate a specified number of unique affixes with wiki links.
 *
 * @function generateUniqueAffixes
 * @param {number} count - Number of unique affixes to generate
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {AffixEntry[]} Array of unique affix entries
 */
export const generateUniqueAffixes = (
  count: number,
  locale: string = 'en',
): AffixEntry[] => {
  const affixes: AffixEntry[] = [];
  const usedAffixNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let affixRoll = rollAffix();
    let affixName = getAffixFromRoll(affixRoll);

    while (affixName === 'Reroll' || usedAffixNames.has(affixName)) {
      affixRoll = rollAffix();
      affixName = getAffixFromRoll(affixRoll);
    }

    usedAffixNames.add(affixName);
    affixes.push({
      text: affixName,
      source: {
        slug: affixName.toLowerCase().replace(/\s+/g, '-'),
        href: getAffixLink(affixName, locale),
      },
    });
  }

  return affixes;
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

  combatant.heroicAwakening.bonuses.proficiencyBonus =
    result.bonuses.proficiencyBonus;
  combatant.heroicAwakening.bonuses.acBonus = result.bonuses.acBonus;
  combatant.heroicAwakening.bonuses.savingThrowBonus =
    result.bonuses.savingThrowBonus;

  if (combatant.proficiencyBonus !== null) {
    combatant.proficiencyBonusOverride =
      combatant.proficiencyBonus + result.bonuses.proficiencyBonus;
  }

  combatant.ac += result.bonuses.acBonus;

  if (result.bonuses.proficiencyBonus > 0 && combatant.hpMaxOverride !== null) {
    const hpBonus = result.bonuses.proficiencyBonus * cr;
    combatant.hpMaxOverride = Math.max(
      combatant.hpMaxOverride + hpBonus,
      combatant.hpMax,
    );
    combatant.hpCurrent = combatant.hpMaxOverride;
  }
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

  const crMatch = crText.match(/(\d+)/);
  const cr = crMatch ? parseInt(crMatch[1], 10) : 0;

  const tierMultiplier = tier === 'mythic' ? 3 : tier === 'legendary' ? 2 : 1;
  const affixCount = tierMultiplier;

  if (combatant.heroicAwakening.awakened) {
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
  }

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
