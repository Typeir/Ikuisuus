/**
 * @fileoverview Party Importer Utilities
 * @description Converts saved party data into InProgressCombatant entries and
 * merges them into an in-progress combat. Handles replace-on-import by removing
 * existing party members before adding new ones.
 *
 * @module partyImporter
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import type { SavedParty } from '@/modules/encounter-planner/domain/parties/party.types';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';

/**
 * Create a minimal InProgressCombatant from a party member name.
 * Party members have no HP, AC, stats, or mechanics — only name, initiative, and slain toggle.
 * When an optional CharacterSheet is provided, its HP, AC, ability scores,
 * initiative bonus, and proficiency bonus are seeded into the combatant.
 *
 * @function createPartyMemberCombatant
 * @param {string} name - Character name
 * @param {CharacterSheet} [character] - Optional linked character sheet to seed stats from
 * @returns {InProgressCombatant} Combatant with isPartyMember flag
 */
export const createPartyMemberCombatant = (
  name: string,
  character?: CharacterSheet,
): InProgressCombatant => ({
  id: generateId(),
  name,
  hpCurrent: character?.hpCurrent ?? 0,
  hpMax: character?.hpMax ?? 0,
  hpMaxOverride: null,
  tempHp: character?.tempHp ?? null,
  ac: character?.ac ?? 0,
  stats: character?.abilityScores ?? {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  },
  conditions: [],
  initiativeValue: null,
  initiativeBonus: character?.initiativeBonus ?? 0,
  proficiencyBonus: character?.proficiencyBonus ?? null,
  proficiencyBonusOverride: null,
  speed: null,
  hpFormula: null,
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain: false,
  sessionOnly: true,
  isPartyMember: true,
  heroicAwakening: {
    fateDieResult: 0,
    heroicDc: 0,
    awakened: false,
    tier: 'none',
    affixes: [],
    bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  mechanics: {
    lair: false,
    stratagem: false,
    legendaryDeed: false,
    resist: false,
    phase: false,
  },
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
});

/**
 * Import a saved party into an in-progress combat.
 * Removes any existing party members (replace-on-import) before adding new ones.
 * New party members are prepended to the turn order.
 *
 * @function importPartyIntoCombat
 * @param {SavedParty} party - The party to import
 * @param {InProgressCombat} combat - The current combat state
 * @returns {InProgressCombat} Updated combat with party members added
 */
export const importPartyIntoCombat = (
  party: SavedParty,
  combat: InProgressCombat,
): InProgressCombat => {
  const nonPartyCombatants = combat.combatants.filter((c) => !c.isPartyMember);
  const nonPartyTurnOrder = combat.turnOrder.filter((id) =>
    nonPartyCombatants.some((c) => c.id === id),
  );

  const newMembers = party.members.map((member) =>
    createPartyMemberCombatant(member.name),
  );

  const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];
  const newTurnOrder = [...newMembers.map((m) => m.id), ...nonPartyTurnOrder];
  const newActiveTurnIndex = Math.max(
    0,
    newTurnOrder.indexOf(activeCombatantId),
  );

  return {
    ...combat,
    combatants: [...newMembers, ...nonPartyCombatants],
    turnOrder: newTurnOrder,
    activeTurnIndex: newActiveTurnIndex,
  };
};
