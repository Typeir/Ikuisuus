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

import { HeroicAffix } from '@/lib/enums/encounterPlanner';
import type { AffixEntry } from '@/lib/types/encounterPlanner';
import type {
  CombatantMechanics,
  InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import { rollDie } from '@/lib/utils/diceUtils';

const heroic_dcs = { '0': 15, '5': 15, '10': 16, '15': 17, '20': 18 };

/**
 * Parse CR input into a finite numeric value.
 *
 * @param {(string | number)} cr - Challenge rating input
 * @returns {number} Parsed CR number, or 0 when parsing fails
 */
const parseCrValue = (cr: string | number): number => {
  if (typeof cr === 'number') {
    return Number.isFinite(cr) ? cr : 0;
  }

  const parsed = Number.parseFloat(cr);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Map CR to heroic DC threshold
 *
 * @param {(string | number)} cr - Challenge rating
 * @returns {number} DC threshold (15–19)
 */
export const getHeroicDc = (cr: string | number): number => {
  const crValue = parseCrValue(cr);

  if (crValue <= 5) {
    return heroic_dcs['5'];
  }

  if (crValue <= 10) {
    return heroic_dcs['10'];
  }

  if (crValue <= 15) {
    return heroic_dcs['15'];
  }

  if (crValue <= 20) {
    return heroic_dcs['20'];
  }

  return 19;
};

/** Ordered affix list derived from the HeroicAffix enum, indexed 1–9 for d10 rolls */
const AFFIX_ROLL_TABLE: readonly string[] = Object.freeze([
  '',
  ...Object.values(HeroicAffix),
]);

/**
 * Get affix name from d10 roll (1–9 = affix, 10 = "Reroll")
 *
 * @param {number} roll - D10 roll result (1–10)
 * @returns {string} Affix name or "Reroll"
 */
export const getAffixFromRoll = (roll: number): string => {
  return AFFIX_ROLL_TABLE[roll] || 'Reroll';
};

/**
 * Get wiki link for a heroic affix
 *
 * @param {string} affixName - Affix display name
 * @param {string} [locale='en'] - Locale for URL
 * @returns {string} Wiki link path
 */
export const getAffixLink = (
  affixName: string,
  locale: string = 'en',
): string => {
  const slug = affixName.toLowerCase().replace(/\s+/g, '-');
  return `/${locale}/library/rules/heroic-awakening/${slug}`;
};

/**
 * Roll d10 for affix selection
 *
 * @returns {number} Result 1–10
 */
export const rollAffix = (): number => {
  return rollDie(10);
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
 * Returns 3 (d20 standard for legendary resistances).
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
 * Returns 3 (d20 standard for legendary actions per round).
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
export const maximizeHitDice = (combatant: InProgressCombatant): void => {
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

