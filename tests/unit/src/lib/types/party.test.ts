/**
 * @fileoverview Unit tests for Party type definitions
 * @description Type-constraint tests verifying PartyMember and SavedParty interfaces.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/types/party - Party type definitions
 */

import type { PartyMember, SavedParty } from '@/lib/types/party';
import { describe, expect, it } from 'vitest';

describe('party types', () => {
  describe('PartyMember interface', () => {
    it('should accept valid party member data', () => {
      const member: PartyMember = { id: 'pm-1', name: 'Alaric' };
      expect(member.id).toBe('pm-1');
      expect(member.name).toBe('Alaric');
    });
  });

  describe('SavedParty interface', () => {
    it('should accept valid saved party data', () => {
      const party: SavedParty = {
        id: 'party-1',
        name: 'Heroes',
        members: [
          { id: 'pm-1', name: 'Alaric' },
          { id: 'pm-2', name: 'Brenna' },
        ],
      };
      expect(party.id).toBe('party-1');
      expect(party.name).toBe('Heroes');
      expect(party.members).toHaveLength(2);
    });

    it('should accept party with empty members array', () => {
      const party: SavedParty = {
        id: 'party-empty',
        name: 'New Party',
        members: [],
      };
      expect(party.members).toHaveLength(0);
    });
  });
});
