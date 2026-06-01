/**
 * @fileoverview Smoke test for party domain types.
 * @description Validates structural conformance of PartyMember and SavedParty interfaces.
 *
 * @module tests/unit/src/modules/encounter-planner/domain/parties/party.types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    PartyMember,
    SavedParty,
} from '@/modules/encounter-planner/domain/parties/party.types';
import { describe, expect, it } from 'vitest';

describe('Party domain types', () => {
  it('PartyMember accepts required fields', () => {
    const member: PartyMember = { id: 'm1', name: 'Aric' };
    expect(member.id).toBe('m1');
    expect(member.name).toBe('Aric');
    expect(member.characterId).toBeUndefined();
  });

  it('PartyMember accepts optional characterId', () => {
    const member: PartyMember = {
      id: 'm2',
      name: 'Sela',
      characterId: 'char-123',
    };
    expect(member.characterId).toBe('char-123');
  });

  it('SavedParty accepts valid shape', () => {
    const party: SavedParty = {
      id: 'p1',
      name: 'The Crimson Guard',
      members: [{ id: 'm1', name: 'Aric' }],
    };
    expect(party.id).toBe('p1');
    expect(party.members).toHaveLength(1);
  });
});
