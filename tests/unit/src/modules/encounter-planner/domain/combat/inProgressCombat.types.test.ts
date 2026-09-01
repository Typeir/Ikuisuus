/**
 * @fileoverview Smoke test for InProgressCombat domain types.
 * @description Validates structural conformance of the ConditionEntry,
 * CombatantMechanics, and related runtime combat interfaces.
 *
 * @module tests/unit/src/modules/encounter-planner/domain/combat/inProgressCombat.types.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    CombatantMechanics,
    ConditionEntry,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { describe, expect, it } from 'vitest';

describe('ConditionEntry type', () => {
  it('accepts a valid ConditionEntry', () => {
    const entry: ConditionEntry = { id: 'blinded-1', text: 'Blinded' };
    expect(entry.id).toBe('blinded-1');
    expect(entry.text).toBe('Blinded');
  });
});

describe('CombatantMechanics type', () => {
  it('accepts a fully populated CombatantMechanics object', () => {
    const mechanics: CombatantMechanics = {
      lair: true,
      stratagem: false,
      legendaryDeed: true,
      resist: false,
      phase: false,
    };
    expect(mechanics.lair).toBe(true);
    expect(mechanics.legendaryDeed).toBe(true);
  });
});
