/**
 * @fileoverview Smoke test for encounter domain types.
 * @description Validates structural conformance of ConditionEntry, SpellRef,
 * and CreatureStats interfaces from the encounter planner domain.
 *
 * @module tests/unit/src/modules/encounter-planner/domain/encounters/encounter.types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    ConditionEntry,
    CreatureStats,
    SpellRef,
} from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { describe, expect, it } from 'vitest';

describe('Encounter domain types', () => {
  it('ConditionEntry accepts valid shape', () => {
    const entry: ConditionEntry = { id: 'poisoned-1', text: 'Poisoned' };
    expect(entry.id).toBeTruthy();
    expect(entry.text).toBeTruthy();
  });

  it('SpellRef accepts valid shape', () => {
    const ref: SpellRef = { slug: 'fireball' };
    expect(ref.slug).toBe('fireball');
  });

  it('CreatureStats accepts valid ability scores', () => {
    const stats: CreatureStats = {
      str: 18,
      dex: 10,
      con: 16,
      int: 8,
      wis: 12,
      cha: 6,
    };
    expect(stats.str).toBe(18);
    expect(stats.con).toBe(16);
  });
});
