/**
 * @fileoverview In-Progress Combat Storage Utilities
 * @description Utilities for persisting and managing in-progress combat snapshots.
 * Separate from encounter planner storage to avoid mutating base encounters.
 * 
 * @module inProgressCombatStorage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import type { AffixEntry, CreatureEntry } from '@/lib/types/encounterPlanner';
import type { CombatantMechanics, HeroicAwakeningState, InProgressCombat, InProgressCombatant } from '@/lib/types/inProgressCombat';
import { calculateInitiativeMod, generateId, rollInitiative } from './encounterStorage';


/**
 *
 *
 * @param {(string | number)} cr challenge rating
 * @return {*}  {number}
 */
const getHeroicDc = (cr: string | number): number => {
  const crNum = typeof cr === 'string' ? parseInt(cr, 10) : cr;
  if (crNum <= 5) return 15;
  if (crNum <= 10) return 16;
  if (crNum <= 15) return 17;
  if (crNum <= 20) return 18;
  return 19;
};

/**
 * Get affix name from d10 roll
 * @param roll 1-10
 * @returns Affix name or "Reroll" if 10
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
 */
const getAffixLink = (affixName: string, locale: string = 'en'): string => {
  const slug = affixName.toLowerCase().replace(/\s+/g, '-');
  return `/${locale}/library/rules/heroic-awakening/${slug}`;
};

/**
 * Roll a d20 for fate die
 */
const rollFateDie = (): number => {
  return Math.floor(Math.random() * 20) + 1;
};

/**
 * Roll d10 for affix selection
 */
const rollAffix = (): number => {
  return Math.floor(Math.random() * 10) + 1;
};

/**
 * Parse mechanics flags from creature tags array
 * @param tags Array of metadata tags (e.g., ['mechanic:lair', 'mechanic:stratagem'])
 * @returns CombatantMechanics object with boolean flags
 */
const parseMechanicsFromTags = (tags?: string[]): CombatantMechanics => {
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
 * Could be extended to read from metadata in the future.
 * 
 * @function getDefaultResistCount
 * @param {string} [crText] - CR text like "CR 5" or "CR 23" (currently unused)
 * @returns {number} Default resist count (3)
 */
const getDefaultResistCount = (crText?: string): number => {
  return 3;
};

/**
 * Get default number of legendary deeds based on CR.
 * Returns 3 (D&D 5e standard for legendary actions per round).
 * 
 * @function getDefaultDeedCount
 * @param {string} [crText] - CR text like "CR 5" or "CR 23" (currently unused)
 * @returns {number} Default deed count (3)
 */
const getDefaultDeedCount = (crText?: string): number => {
  return 3;
};

/**
 * Maximize hit dice for a combatant based on their HP formula.
 * If formula exists: parses "NdM" and calculates N*M + constant.
 * If formula missing: uses percentage-based approach (assume dice represents ~50% of HP,
 * then scales to 100% when maximized) plus CON modifier per level.
 * 
 * @function maximizeHitDice
 * @param {InProgressCombatant} combatant - The combatant to maximize HP for
 * @returns {void} Mutates combatant.hpMaxOverride and hpCurrent
 * 
 * @description
 * Formula parsing: "10d10 + 50" → (10*10) + 50 = 150
 * Percentage-based (no formula): 
 *   - Assume current HP includes die rolls (~50% of max) plus CON modifier
 *   - Calculate: CON_MOD = (CON - 10) / 2, rounded down
 *   - MAX = (diceCount * dieSize) + (diceCount * CON_MOD)
 *   - Estimate dice count: (CURRENT_MAX - CON_MOD) / (DICE_SIZE / 2 + CON_MOD)
 *   - Then scale up: (diceCount * dieSize) + (diceCount * CON_MOD)
 */
const maximizeHitDice = (combatant: InProgressCombatant): void => {
  const conMod = Math.floor((combatant.stats.con - 10) / 2);
  
  // Try to parse hit dice formula
  if (combatant.hpFormula) {
    const diceMatch = combatant.hpFormula.match(/(\d+)d(\d+)/);
    
    if (diceMatch) {
      const diceCount = parseInt(diceMatch[1], 10);
      const dieSize = parseInt(diceMatch[2], 10);
      const baseHP = diceCount * dieSize + diceCount * Math.max(conMod, 1);
      
      const constantMatch = combatant.hpFormula.match(/\+\s*(\d+)$/);
      const additionalConstant = constantMatch ? parseInt(constantMatch[1], 10) : 0;
      
      combatant.hpMaxOverride = baseHP + additionalConstant;
      combatant.hpCurrent = combatant.hpMaxOverride;
      return;
    }
  }
  
  // Fallback: percentage-based calculation when formula is missing
  // Assume current max is approximately 50% of maximized HP
  // Calculate: percentageOfDice = currentMax / 100
  // Then: maximized = (percentageOfDice * 2) to represent 100%
  const estimatedMaximized = Math.max(
    combatant.hpMax * 2,
    combatant.hpMax + Math.round(combatant.hpMax * 0.5)
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
 * @returns {HeroicAwakeningState} Object with tier, affixes, and bonuses.
 * 
 * @description
 * Rolling algorithm:
 * 1. Start at "awakened" tier with 1 affix slot
 * 2. Roll d10: 1-9 = specific affix, 10 = "Reroll"
 * 3. On "Reroll": upgrade tier, add affix slot, roll again
 * 4. Tiers: awakened (1 affix) → legendary (2 affixes) → mythic (3 affixes)
 * 5. Mythic is max tier; further 10s just reroll the affix
 */
const rollAffixesAndDetermineTier = (locale: string = 'en'): HeroicAwakeningState => {
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
 * Rerolls duplicates and "Reroll" results to ensure uniqueness.
 * 
 * @function generateUniqueAffixes
 * @param {number} count - Number of unique affixes to generate
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {AffixEntry[]} Array of unique affix entries
 */
const generateUniqueAffixes = (count: number, locale: string = 'en'): AffixEntry[] => {
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
 * Convert a base creature to an in-progress combatant.
 * Preserves heroic awakening state if the creature was already awakened in the planner.
 * 
 * @function createInProgressCombatant
 * @param {CreatureEntry} creature - Base creature to convert
 * @returns {InProgressCombatant} Combat-ready combatant with preserved awakening state
 */
export const createInProgressCombatant = (creature: CreatureEntry): InProgressCombatant => {
  const mechanics = parseMechanicsFromTags(creature.tags);
  const deedCount = mechanics.legendaryDeed ? getDefaultDeedCount(creature.crText) : 0;
  const resistCount = mechanics.resist ? getDefaultResistCount(creature.crText) : 0;

  // Determine HP max: use creature's hpOverride if awakened in planner, else use hpMax
  const hpMax = creature.heroicAwakening?.hpOverride ?? creature.hpMax;
  const hpCurrent = creature.heroicAwakening ? creature.hpCurrent : creature.hpCurrent;
  
  // Determine AC: base AC + any bonus from awakening
  const ac = creature.heroicAwakening 
    ? creature.ac + creature.heroicAwakening.bonuses.acBonus 
    : creature.ac;
  
  // Determine proficiency bonus override if creature was awakened
  const proficiencyBonusOverride = creature.heroicAwakening?.bonuses.proficiencyBonus ?? null;

  return {
    id: creature.id,
    name: creature.name,
    hpCurrent: hpCurrent,
    hpMax: hpMax,
    hpMaxOverride: creature.heroicAwakening?.hpOverride ?? null,
    tempHp: creature.tempHp,
    ac: ac,
    stats: { ...creature.stats },
    conditions: creature.conditions.map((c) => ({ id: c.id, text: c.text })),
    initiativeValue: creature.initiativeValue,
    initiativeBonus: creature.initiativeBonus,
    proficiencyBonus: creature.proficiencyBonus,
    proficiencyBonusOverride: proficiencyBonusOverride,
    speed: creature.speed,
    hpFormula: creature.hpFormula,
    details: {
      buffs: [...creature.details.buffs],
      items: [...creature.details.items],
      spells: creature.details.spells.map((s) => ({ slug: s.slug })),
      affixes: creature.details.affixes.map((a) => ({ ...a })),
    },
    slain: creature.slain ?? false,
    sessionOnly: false,
    sourceHref: creature.sourceHref,
    crText: creature.crText,
    // Preserve awakening state from planner or create fresh
    heroicAwakening: creature.heroicAwakening 
      ? {
          fateDieResult: creature.heroicAwakening.fateDieResult,
          heroicDc: creature.heroicAwakening.heroicDc,
          awakened: creature.heroicAwakening.awakened,
          tier: creature.heroicAwakening.tier,
          affixes: creature.heroicAwakening.affixes.map((a) => ({ ...a })),
          bonuses: {
            proficiencyBonus: creature.heroicAwakening.bonuses.proficiencyBonus,
            acBonus: creature.heroicAwakening.bonuses.acBonus,
            savingThrowBonus: creature.heroicAwakening.bonuses.savingThrowBonus,
          },
          hpOverride: creature.heroicAwakening.hpOverride,
        }
      : {
          fateDieResult: 0,
          heroicDc: 0,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: {
            proficiencyBonus: 0,
            acBonus: 0,
            savingThrowBonus: 0,
          },
          hpOverride: null,
        },
    mechanics,
    legendaryDeedsUsed: new Array(deedCount).fill(false),
    resistRemaining: resistCount,
    phaseDeeds: {
      wounded: false,
      bloodied: false,
      doomed: false,
    },
    locked: [],
  };
};

/**
 * Apply Heroic Awakening to a single combatant.
 * Runs exactly once per combat snapshot at creation.
 * 
 * @function applyHeroicAwakening
 * @param {InProgressCombatant} combatant - The combatant to awaken
 * @param {string} [crText] - CR text like "CR 5" (skips awakening if not provided)
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {void}
 * 
 * @description
 * Heroic Awakening flow:
 * 1. Skip if no CR text (non-imported creature)
 * 2. Calculate heroic DC from CR
 * 3. Roll fate die (d20) - awakens if >= DC
 * 4. If awakened: maximize HP from hit dice formula
 * 5. Roll affixes: d10 where 10="Reroll" upgrades tier
 *    - Awakened: 1 affix, +1 bonuses
 *    - Legendary: 2 affixes, +2 bonuses, +2 HP/CR
 *    - Mythic: 3 affixes, +3 bonuses, +3 HP/CR
 * 6. Apply bonuses to AC, proficiency, and HP
 */
export const applyHeroicAwakening = (
  combatant: InProgressCombatant,
  crText?: string,
  locale: string = 'en'
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

  // Maximize hit dice first
  maximizeHitDice(combatant);

  const result = rollAffixesAndDetermineTier(locale);
  
  combatant.heroicAwakening.affixes = result.affixes.slice(0, 3);
  combatant.heroicAwakening.tier = result.tier;

  combatant.heroicAwakening.bonuses.proficiencyBonus = result.bonuses.proficiencyBonus;
  combatant.heroicAwakening.bonuses.acBonus = result.bonuses.acBonus;
  combatant.heroicAwakening.bonuses.savingThrowBonus = result.bonuses.savingThrowBonus;

  // Apply proficiency bonus override
  if (combatant.proficiencyBonus !== null) {
    combatant.proficiencyBonusOverride = combatant.proficiencyBonus + result.bonuses.proficiencyBonus;
  }

  // Apply AC bonus
  combatant.ac += result.bonuses.acBonus;

  // Apply HP bonus based on tier
  if (result.bonuses.proficiencyBonus > 0 && combatant.hpMaxOverride !== null) {
    const hpBonus = result.bonuses.proficiencyBonus * cr;
    combatant.hpMaxOverride = Math.max(combatant.hpMaxOverride + hpBonus, combatant.hpMax);
    combatant.hpCurrent = combatant.hpMaxOverride;
  }
};

/**
 * Force a specific heroic awakening tier on a combatant.
 * Allows manual override of heroic awakening for testing/customization.
 * Rerolls affixes and resets bonuses if changing tiers (prevents infinite stacking).
 * 
 * @function forceHeroicAwakening
 * @param {InProgressCombatant} combatant - The combatant to awaken
 * @param {'awakened'|'legendary'|'mythic'} tier - Target tier to force
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {void}
 * 
 * @description
 * Forced awakening flow:
 * 1. Skip if no CR text (non-imported creature)
 * 2. If already awakened, undo previous bonuses (remove AC, HP) before applying new ones
 * 3. Set tier bonuses based on tier level (1/2/3 for each)
 * 4. Simulate fate die result (10/15/20) for display
 * 5. Apply all stat bonuses (proficiency, AC, saving throws)
 * 6. Generate unique affixes capped to tier count (1/2/3)
 * 7. Maximize hit dice and apply HP bonus per CR
 */
export const forceHeroicAwakening = (
  combatant: InProgressCombatant,
  tier: 'awakened' | 'legendary' | 'mythic',
  locale: string = 'en'
): void => {
  const crText = combatant.crText;
  if (!crText) return;

  const crMatch = crText.match(/(\d+)/);
  const cr = crMatch ? parseInt(crMatch[1], 10) : 0;

  const tierMultiplier = tier === 'mythic' ? 3 : tier === 'legendary' ? 2 : 1;
  const affixCount = tierMultiplier;

  if (combatant.heroicAwakening.awakened) {
    const previousTier = combatant.heroicAwakening.tier;
    const previousMultiplier = previousTier === 'mythic' ? 3 : previousTier === 'legendary' ? 2 : 1;
    
    combatant.ac -= previousMultiplier;
    combatant.hpMax -= previousMultiplier * cr;
    
    if (combatant.proficiencyBonus !== null && combatant.proficiencyBonusOverride !== null) {
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
    combatant.proficiencyBonusOverride = combatant.proficiencyBonus + tierMultiplier;
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
 * Sort combatants by initiative descending with stable tie-breakers.
 * 
 * @function sortCombatantsByInitiative
 * @param {InProgressCombatant[]} combatants - Array of combatants to sort
 * @returns {string[]} Sorted array of combatant IDs
 * 
 * @description
 * Sorting priority:
 * 1. Initiative value (descending)
 * 2. Dexterity modifier (descending tie-breaker)
 * 3. Name alphabetically (final tie-breaker)
 */
export const sortCombatantsByInitiative = (combatants: InProgressCombatant[]): string[] => {
  const sorted = [...combatants].sort((a, b) => {
    if ((b.initiativeValue || 0) !== (a.initiativeValue || 0)) {
      return (b.initiativeValue || 0) - (a.initiativeValue || 0);
    }
    const aDex = calculateInitiativeMod(a.stats.dex);
    const bDex = calculateInitiativeMod(b.stats.dex);
    if (bDex !== aDex) return bDex - aDex;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((c) => c.id);
};

/**
 * Resort combatants by initiative while preserving the active combatant index.
 * Recomputes turn order and updates activeTurnIndex to keep the same combatant active.
 * @param combat The in-progress combat snapshot
 * @returns Updated combat with new turn order and preserved active combatant
 */
export const resortCombatants = (combat: InProgressCombat): InProgressCombat => {
  const newTurnOrder = sortCombatantsByInitiative(combat.combatants);
  const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];
  const newActiveTurnIndex = newTurnOrder.indexOf(activeCombatantId);

  return {
    ...combat,
    turnOrder: newTurnOrder,
    activeTurnIndex: newActiveTurnIndex >= 0 ? newActiveTurnIndex : 0,
  };
};

/**
 * Create a fresh in-progress combat snapshot from a base encounter.
 * 
 * @function createInProgressCombat
 * @param {object} encounter - Base encounter data
 * @param {string} encounter.id - Encounter ID
 * @param {string} encounter.name - Encounter name
 * @param {CreatureEntry[]} encounter.creatures - Array of creatures
 * @param {string} [locale='en'] - Locale for affix wiki links
 * @returns {InProgressCombat} Fresh combat snapshot
 * 
 * @description
 * Combat creation flow:
 * 1. Convert creatures to combatants
 * 2. Roll initiative for combatants missing values
 * 3. Apply Heroic Awakening to each combatant
 * 4. Sort by initiative to establish turn order
 */
export const createInProgressCombat = (
  encounter: { id: string; name: string; creatures: CreatureEntry[] },
  locale: string = 'en'
): InProgressCombat => {
  const now = new Date().toISOString();

  const combatants = encounter.creatures.map((creature) => createInProgressCombatant(creature));

  for (const combatant of combatants) {
    if (combatant.initiativeValue === null) {
      combatant.initiativeValue = rollInitiative(combatant.initiativeBonus);
    }
  }

  for (const combatant of combatants) {
    applyHeroicAwakening(combatant, combatant.crText, locale);
  }

  const turnOrder = sortCombatantsByInitiative(combatants);

  return {
    id: generateId(),
    encounterId: encounter.id,
    encounterName: encounter.name,
    createdAt: now,
    startedAt: now,
    combatants,
    roundNumber: 1,
    activeTurnIndex: 0,
    turnOrder,
  };
};

/**
 * Migrate a combatant to include new mechanics fields if missing.
 * Provides backward compatibility for saved combats from before the mechanics update.
 * 
 * @function migrateCombatant
 * @param {any} combatant - Possibly outdated combatant data
 * @returns {InProgressCombatant} Migrated combatant with all required fields
 * 
 * @description
 * Migration steps:
 * 1. Add mechanics object if missing (all false)
 * 2. Add legendaryDeedsUsed array if missing (empty or 3 slots)
 * 3. Add resistRemaining count if missing (0 or 3)
 * 4. Add phaseDeeds tracking if missing
 */
const migrateCombatant = (combatant: any): InProgressCombatant => {
  if (!combatant.mechanics) {
    combatant.mechanics = {
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    };
  }

  if (!Array.isArray(combatant.legendaryDeedsUsed)) {
    combatant.legendaryDeedsUsed = combatant.mechanics.legendaryDeed ? [false, false, false] : [];
  }

  if (typeof combatant.resistRemaining !== 'number') {
    combatant.resistRemaining = combatant.mechanics.resist ? 3 : 0;
  }

  if (!combatant.phaseDeeds) {
    combatant.phaseDeeds = {
      wounded: false,
      bloodied: false,
      doomed: false,
    };
  }

  return combatant as InProgressCombatant;
};

/**
 * Migrate an in-progress combat to include new fields if missing.
 * Applies combatant migrations to ensure backward compatibility.
 * 
 * @function migrateInProgressCombat
 * @param {any} combat - Possibly outdated combat data
 * @returns {InProgressCombat} Migrated combat with all required fields
 */
const migrateInProgressCombat = (combat: any): InProgressCombat => {
  return {
    ...combat,
    combatants: combat.combatants.map(migrateCombatant),
  };
};

/**
 * Get all in-progress combats from localStorage.
 * Applies migrations for backward compatibility.
 * 
 * @function getInProgressCombats
 * @returns {InProgressCombat[]} Array of in-progress combats (empty if SSR or error)
 */
export const getInProgressCombats = (): InProgressCombat[] => {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(EncounterStorage.InProgressCombats);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map(migrateInProgressCombat);
  } catch (error) {
    logger.warning('Error loading in-progress combats from localStorage', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
};

/**
 * Get a single in-progress combat by ID.
 * 
 * @function getInProgressCombat
 * @param {string} id - Combat ID to find
 * @returns {InProgressCombat|null} Combat if found, null otherwise
 */
export const getInProgressCombat = (id: string): InProgressCombat | null => {
  const combats = getInProgressCombats();
  return combats.find((c) => c.id === id) || null;
};

/**
 * Save an in-progress combat to localStorage.
 * Updates existing or appends new combat.
 * 
 * @function saveInProgressCombat
 * @param {InProgressCombat} combat - Combat to save
 * @returns {void}
 */
export const saveInProgressCombat = (combat: InProgressCombat): void => {
  if (typeof window === 'undefined') return;

  try {
    const combats = getInProgressCombats();
    const index = combats.findIndex((c) => c.id === combat.id);

    if (index >= 0) {
      combats[index] = combat;
    } else {
      combats.push(combat);
    }

    localStorage.setItem(EncounterStorage.InProgressCombats, JSON.stringify(combats));
  } catch (error) {
    logger.error('Error saving in-progress combat to localStorage', { error: error instanceof Error ? error.message : String(error), combatId: combat.id });
  }
};

/**
 * Delete an in-progress combat from localStorage.
 * 
 * @function deleteInProgressCombat
 * @param {string} id - Combat ID to delete
 * @returns {void}
 */
export const deleteInProgressCombat = (id: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const combats = getInProgressCombats();
    const filtered = combats.filter((c) => c.id !== id);
    localStorage.setItem(EncounterStorage.InProgressCombats, JSON.stringify(filtered));
  } catch (error) {
    logger.error('Error deleting in-progress combat from localStorage', { error: error instanceof Error ? error.message : String(error), combatId: id });
  }
};

/**
 * Get the currently active in-progress combat ID from localStorage.
 * 
 * @function getActiveInProgressCombatId
 * @returns {string|null} Active combat ID or null if none/SSR
 */
export const getActiveInProgressCombatId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EncounterStorage.ActiveCombatId);
};

/**
 * Set or clear the active in-progress combat ID in localStorage.
 * 
 * @function setActiveInProgressCombatId
 * @param {string|null} id - Combat ID to set as active, or null to clear
 * @returns {void}
 */
export const setActiveInProgressCombatId = (id: string | null): void => {
  if (typeof window === 'undefined') return;
  if (id === null) {
    localStorage.removeItem(EncounterStorage.ActiveCombatId);
  } else {
    localStorage.setItem(EncounterStorage.ActiveCombatId, id);
  }
};

/**
 * Export an in-progress combat as JSON
 */
export const exportInProgressCombat = (combat: InProgressCombat): string => {
  return JSON.stringify(combat, null, 2);
};

/**
 * Get next non-slain combatant for turn order
 */
export const getNextActiveCombatantIndex = (
  combatants: InProgressCombatant[],
  turnOrder: string[],
  currentIndex: number
): number => {
  const nonSlainIds = turnOrder.filter((id) => {
    const combatant = combatants.find((c) => c.id === id);
    return combatant && !combatant.slain;
  });

  if (nonSlainIds.length === 0) return currentIndex;

  const currentId = turnOrder[currentIndex];
  const currentIndexInNonSlain = nonSlainIds.indexOf(currentId);

  const nextIndex = (currentIndexInNonSlain + 1) % nonSlainIds.length;
  const nextId = nonSlainIds[nextIndex];

  return turnOrder.indexOf(nextId);
};
