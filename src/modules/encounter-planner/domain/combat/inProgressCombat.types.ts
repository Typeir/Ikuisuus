/**
 * @fileoverview In-Progress Combat Types
 * @description TypeScript interfaces for runtime combat snapshots during Play Mode.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/modules/encounter-planner/domain/combat/inProgressCombat.types
 */

import type { AffixEntry, CreatureStats } from '../encounters/encounter.types';

/**
 * Condition entry for in-progress combatants
 *
 * @interface ConditionEntry
 * @property {string} id - Unique identifier for the condition instance
 * @property {string} text - Display text describing the condition
 */
export interface ConditionEntry {
  id: string;
  text: string;
}

/**
 * Mechanics flags derived from monster metadata tags.
 *
 * @interface CombatantMechanics
 * @property {boolean} lair - True if creature has mechanic:lair tag - triggers alert on round start
 * @property {boolean} stratagem - True if creature has mechanic:stratagem tag - shows tactical badge
 * @property {boolean} legendaryDeed - True if creature has mechanic:legendary-deed tag - enables deed tracker
 * @property {boolean} resist - True if creature has Legendary Deed: Resist ability - enables resist tracker
 * @property {boolean} phase - True if creature has mechanic:phase tag - enables phase marker and phase deed tracker
 */
export interface CombatantMechanics {
  lair: boolean;
  stratagem: boolean;
  legendaryDeed: boolean;
  resist: boolean;
  phase: boolean;
}

/**
 * Heroic Awakening state for a single combatant.
 * Tracks the results of fate die rolls and applied tier bonuses.
 *
 * @interface HeroicAwakeningState
 * @property {number} fateDieResult - D20 result from fate die roll (1-20)
 * @property {number} heroicDc - Target DC based on creature CR
 * @property {boolean} awakened - Whether awakening triggered
 * @property {'none'|'awakened'|'legendary'|'mythic'} tier - Current awakening tier
 * @property {AffixEntry[]} affixes - Applied heroic affixes
 * @property {Object} bonuses - Stat bonuses from awakening tier
 * @property {number} bonuses.tierBonus - Additional tier bonus
 * @property {number} bonuses.acBonus - Additional AC bonus
 * @property {number} bonuses.savingThrowBonus - Additional save bonus
 * @property {number|null} hpOverride - Overridden hpMax if maximized and scaled
 */
export interface HeroicAwakeningState {
  fateDieResult: number;
  heroicDc: number;
  awakened: boolean;
  tier: 'none' | 'awakened' | 'legendary' | 'mythic';
  affixes: AffixEntry[];
  bonuses: {
    tierBonus: number;
    acBonus: number;
    savingThrowBonus: number;
  };
  hpOverride: number | null;
}

/**
 * Runtime combatant in an in-progress combat snapshot.
 * Extends base creature data with combat state and session-only flag.
 *
 * @interface InProgressCombatant
 * @property {string} id - Unique combatant identifier
 * @property {string} name - Display name
 * @property {number} hpCurrent - Current hit points
 * @property {number} hpMax - Maximum hit points
 * @property {number|null} hpMaxOverride - Overridden max HP for Heroic Awakening
 * @property {number|null} tempHp - Temporary hit points
 * @property {number} ac - Armor class
 * @property {CreatureStats} stats - Ability scores
 * @property {Array<{id: string, text: string}>} conditions - Active conditions
 * @property {number|null} initiativeValue - Rolled initiative
 * @property {number} initiativeBonus - Initiative modifier
 * @property {number|null} tierBonus - tier bonus
 * @property {number|null} tierBonusOverride - Overridden proficiency for Heroic Awakening
 * @property {string|null} speed - Movement speed string
 * @property {string|null} hpFormula - Hit dice formula
 * @property {Object} details - Extended creature details
 * @property {boolean} slain - Whether combatant is defeated
 * @property {boolean} sessionOnly - True if added during Play Mode (not from encounter)
 * @property {string[]} [locked] - Array of field names that are locked from editing
 * @property {string} [sourceHref] - Wiki link for imported creatures
 * @property {string} [crText] - Challenge rating display text
 * @property {HeroicAwakeningState} heroicAwakening - Awakening state
 * @property {CombatantMechanics} mechanics - Derived mechanic flags
 * @property {boolean[]} legendaryDeedsUsed - Deeds used this round
 * @property {number} resistRemaining - Legendary Resist uses remaining
 * @property {boolean} [isPartyMember] - True if this combatant is an imported party member
 */
export interface InProgressCombatant {
  id: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  hpMaxOverride: number | null;
  tempHp: number | null;
  ac: number;
  stats: CreatureStats;
  conditions: Array<{ id: string; text: string }>;
  initiativeValue: number | null;
  initiativeBonus: number;
  tierBonus: number | null;
  tierBonusOverride: number | null;
  speed: string | null;
  hpFormula: string | null;
  details: {
    buffs: string[];
    items: string[];
    spells: Array<{ slug: string }>;
    affixes: AffixEntry[];
  };
  slain: boolean;
  sessionOnly: boolean;
  locked?: string[];
  sourceHref?: string;
  crText?: string;
  heroicAwakening: HeroicAwakeningState;
  mechanics: CombatantMechanics;
  legendaryDeedsUsed: boolean[];
  resistRemaining: number;
  phaseDeeds: {
    wounded: boolean;
    bloodied: boolean;
    doomed: boolean;
  };
  isPartyMember?: boolean;
}

/**
 * In-progress combat snapshot.
 * Represents the runtime state during Play Mode, stored separately from base encounters.
 *
 * @interface InProgressCombat
 * @property {string} id - Unique combat session identifier
 * @property {string} encounterId - Reference to the source encounter
 * @property {string} encounterName - Display name from source encounter
 * @property {string} createdAt - ISO timestamp of encounter creation
 * @property {string} startedAt - ISO timestamp of combat start
 * @property {InProgressCombatant[]} combatants - All combatants in the combat
 * @property {number} roundNumber - Current combat round (1-indexed)
 * @property {number} activeTurnIndex - Index of active combatant in turnOrder
 * @property {string[]} turnOrder - Combatant IDs in initiative order
 */
export interface InProgressCombat {
  id: string;
  encounterId: string;
  encounterName: string;
  createdAt: string;
  startedAt: string;
  combatants: InProgressCombatant[];
  roundNumber: number;
  activeTurnIndex: number;
  turnOrder: string[];
}
