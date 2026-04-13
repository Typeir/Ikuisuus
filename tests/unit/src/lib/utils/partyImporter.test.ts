/**
 * @fileoverview Unit tests for Party Importer Utilities
 * @description Tests party member combatant creation and combat import behavior.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/partyImporter - Party import utilities
 */

import type { InProgressCombat } from '@/lib/types/inProgressCombat';
import type { SavedParty } from '@/lib/types/party';
import {
    createPartyMemberCombatant,
    importPartyIntoCombat,
} from '@/lib/utils/partyImporter';
import { describe, expect, it } from 'vitest';

/**
 * Creates a minimal InProgressCombat fixture for testing.
 *
 * @param {Partial<InProgressCombat>} overrides - Optional property overrides
 * @returns {InProgressCombat} Test combat fixture
 */
function createTestCombat(
  overrides: Partial<InProgressCombat> = {},
): InProgressCombat {
  return {
    id: 'combat-1',
    encounterId: 'enc-1',
    encounterName: 'Test Encounter',
    combatants: [],
    turnOrder: [],
    activeTurnIndex: 0,
    roundNumber: 1,
    ...overrides,
  };
}

const mockParty: SavedParty = {
  id: 'party-1',
  name: 'Heroes',
  members: [
    { id: 'm1', name: 'Alaric' },
    { id: 'm2', name: 'Brenna' },
  ],
};

describe('partyImporter', () => {
  describe('createPartyMemberCombatant', () => {
    it('should create combatant with correct name', () => {
      const combatant = createPartyMemberCombatant('Alaric');
      expect(combatant.name).toBe('Alaric');
    });

    it('should set isPartyMember flag to true', () => {
      const combatant = createPartyMemberCombatant('Alaric');
      expect(combatant.isPartyMember).toBe(true);
    });

    it('should set sessionOnly flag to true', () => {
      const combatant = createPartyMemberCombatant('Alaric');
      expect(combatant.sessionOnly).toBe(true);
    });

    it('should have null initiative value', () => {
      const combatant = createPartyMemberCombatant('Alaric');
      expect(combatant.initiativeValue).toBeNull();
    });

    it('should have zeroed HP and AC', () => {
      const combatant = createPartyMemberCombatant('Alaric');
      expect(combatant.hpCurrent).toBe(0);
      expect(combatant.hpMax).toBe(0);
      expect(combatant.ac).toBe(0);
    });

    it('should generate unique IDs per invocation', () => {
      const a = createPartyMemberCombatant('Alaric');
      const b = createPartyMemberCombatant('Brenna');
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('importPartyIntoCombat', () => {
    it('should add party members to empty combat', () => {
      const combat = createTestCombat();
      const result = importPartyIntoCombat(mockParty, combat);

      expect(result.combatants).toHaveLength(2);
      expect(result.combatants[0].name).toBe('Alaric');
      expect(result.combatants[1].name).toBe('Brenna');
    });

    it('should prepend party members to turn order', () => {
      const combat = createTestCombat();
      const result = importPartyIntoCombat(mockParty, combat);

      expect(result.turnOrder).toHaveLength(2);
      expect(result.turnOrder[0]).toBe(result.combatants[0].id);
      expect(result.turnOrder[1]).toBe(result.combatants[1].id);
    });

    it('should preserve existing non-party combatants', () => {
      const existing = createPartyMemberCombatant('Monster');
      existing.isPartyMember = false;
      existing.id = 'monster-1';

      const combat = createTestCombat({
        combatants: [existing],
        turnOrder: ['monster-1'],
      });

      const result = importPartyIntoCombat(mockParty, combat);
      expect(result.combatants).toHaveLength(3);
      expect(result.combatants[2].id).toBe('monster-1');
    });

    it('should replace existing party members on import', () => {
      const oldPartyMember = createPartyMemberCombatant('OldChar');
      oldPartyMember.id = 'old-party-1';

      const monster = createPartyMemberCombatant('Monster');
      monster.isPartyMember = false;
      monster.id = 'monster-1';

      const combat = createTestCombat({
        combatants: [oldPartyMember, monster],
        turnOrder: ['old-party-1', 'monster-1'],
      });

      const result = importPartyIntoCombat(mockParty, combat);

      expect(result.combatants.some((c) => c.id === 'old-party-1')).toBeFalsy();
      expect(result.combatants.filter((c) => c.isPartyMember)).toHaveLength(2);
      expect(result.combatants.some((c) => c.id === 'monster-1')).toBeTruthy();
    });

    it('should preserve active combatant index when possible', () => {
      const monster = createPartyMemberCombatant('Monster');
      monster.isPartyMember = false;
      monster.id = 'monster-1';

      const combat = createTestCombat({
        combatants: [monster],
        turnOrder: ['monster-1'],
        activeTurnIndex: 0,
      });

      const result = importPartyIntoCombat(mockParty, combat);
      const monsterIndex = result.turnOrder.indexOf('monster-1');
      expect(result.activeTurnIndex).toBe(monsterIndex);
    });

    it('should handle empty party gracefully', () => {
      const emptyParty: SavedParty = {
        id: 'empty',
        name: 'Empty',
        members: [],
      };
      const combat = createTestCombat();
      const result = importPartyIntoCombat(emptyParty, combat);

      expect(result.combatants).toHaveLength(0);
      expect(result.turnOrder).toHaveLength(0);
    });
  });
});
