/**
 * @fileoverview Tests for the monster slot schema.
 * @description The header carries Defence, Deflect and Dodge in table order,
 * the abilities and the list are subsets of the schema, and the main schema
 * re-exports it whole
 *
 * @module tests/unit/src/modules/library/domain/monsterSlots.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-15
 */

import {
  ABILITY_SLOTS,
  MONSTER_LIST_SLOTS,
  MONSTER_SLOT_NAMES,
  MONSTER_SLOTS,
} from '@/modules/library/domain/monsterSlots';
import * as schema from '@/modules/library/domain/slots';
import { describe, expect, it } from 'vitest';

describe('monster slots', () => {
  it('names Defence, Deflect and Dodge in that order, with no Armour Class', () => {
    const names = MONSTER_SLOT_NAMES;
    const at = names.indexOf('defence');
    expect(names.slice(at, at + 3)).toEqual(['defence', 'deflect', 'dodge']);
    expect(names).not.toContain('armorClass');
    expect(MONSTER_SLOTS.defence).toBe('Defence');
  });

  it('draws the abilities and the list from the schema', () => {
    for (const name of [...ABILITY_SLOTS, ...MONSTER_LIST_SLOTS]) {
      expect(MONSTER_SLOT_NAMES, name).toContain(name);
    }
    expect(ABILITY_SLOTS).toHaveLength(6);
  });

  it('is re-exported by the main schema', () => {
    expect(schema.MONSTER_SLOTS).toBe(MONSTER_SLOTS);
    expect(schema.MONSTER_SLOT_NAMES).toBe(MONSTER_SLOT_NAMES);
    expect(schema.ABILITY_SLOTS).toBe(ABILITY_SLOTS);
    expect(schema.MONSTER_LIST_SLOTS).toBe(MONSTER_LIST_SLOTS);
  });
});
