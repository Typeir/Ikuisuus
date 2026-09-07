/**
 * @fileoverview Tests for slot label keys.
 * @description A slot's label key is its own name unless the host renames it.
 *
 * @module tests/unit/src/modules/library/domain/slotLabels.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { SLOT_LABEL_OVERRIDES, slotLabelKey } from '@/modules/library/domain/slotLabels';
import { slotLabelKey as reexported } from '@/modules/library/domain/slots';
import { describe, expect, it } from 'vitest';

describe('slotLabelKey', () => {
  it('uses the slot name, the host override when there is one, and ignores unknown hosts', () => {
    expect(slotLabelKey('cost')).toBe('slots.cost');
    expect(slotLabelKey('cost', 'Spell')).toBe('slots.castingTime');
    expect(slotLabelKey('cost', 'Feature')).toBe('slots.cost');
    expect(slotLabelKey('saves', 'Vocation')).toBe('slots.savingThrowProficiencies');
    expect(slotLabelKey('saves', 'Specialization')).toBe('slots.savingThrowProficiencies');
    expect(slotLabelKey('saves', 'Monster')).toBe('slots.saves');
    expect(reexported).toBe(slotLabelKey);
  });

  it('renames the same vocation slots for both vocation hosts', () => {
    expect(SLOT_LABEL_OVERRIDES.Specialization).toEqual(SLOT_LABEL_OVERRIDES.Vocation);
  });
});
