/**
 * @fileoverview Tests for the slot schema.
 *
 * @module tests/unit/src/modules/library/domain/slots.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-03
 */

import {
  FEATURE_SLOT_NAMES,
  HEIRLOOM_SLOT_NAMES,
  SLOT_ELEMENT_NAMES,
  SLOT_NAME_BY_ELEMENT,
  SLOT_NAMES,
  slotLabelKey,
} from '@/modules/library/domain/slots';
import { describe, expect, it } from 'vitest';

describe('slots schema', () => {
  it('lists heirloom slots before feature slots, without overlap', () => {
    expect(SLOT_NAMES).toEqual([...HEIRLOOM_SLOT_NAMES, ...FEATURE_SLOT_NAMES]);
    expect(new Set(SLOT_NAMES).size).toBe(SLOT_NAMES.length);
    expect(HEIRLOOM_SLOT_NAMES).toHaveLength(17);
    expect(HEIRLOOM_SLOT_NAMES[0]).toBe('rarity');
    expect(FEATURE_SLOT_NAMES).toEqual(['cost', 'targets', 'recharge']);
  });

  it('maps element names back to slot names one to one', () => {
    for (const name of SLOT_NAMES) {
      expect(SLOT_NAME_BY_ELEMENT[SLOT_ELEMENT_NAMES[name]]).toBe(name);
    }
    expect(Object.keys(SLOT_NAME_BY_ELEMENT)).toHaveLength(SLOT_NAMES.length);
  });

  it('derives catalogue keys from the slot name', () => {
    expect(slotLabelKey('masterfulBlow')).toBe('slots.masterfulBlow');
    expect(slotLabelKey('cost')).toBe('slots.cost');
  });
});
