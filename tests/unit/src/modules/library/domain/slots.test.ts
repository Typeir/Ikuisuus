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
  POOL_SLOT_NAMES,
  SLOT_ELEMENT_NAMES,
  SLOT_NAME_BY_ELEMENT,
  SLOT_NAMES,
  slotLabelKey,
} from '@/modules/library/domain/slots';
import { describe, expect, it } from 'vitest';

describe('slots schema', () => {
  it('lists heirloom slots before feature slots, each name once', () => {
    expect(new Set(SLOT_NAMES).size).toBe(SLOT_NAMES.length);
    expect(SLOT_NAMES.slice(0, HEIRLOOM_SLOT_NAMES.length)).toEqual(
      HEIRLOOM_SLOT_NAMES,
    );
    for (const name of FEATURE_SLOT_NAMES) {
      expect(SLOT_NAMES, name).toContain(name);
    }
    expect(HEIRLOOM_SLOT_NAMES).toHaveLength(18);
    expect(HEIRLOOM_SLOT_NAMES[0]).toBe('rarity');
  });

  it('resolves a feature in the order a use resolves', () => {
    expect(FEATURE_SLOT_NAMES).toEqual([
      'mastery',
      'deed',
      'cost',
      'charges',
      'targets',
      'recharge',
    ]);
  });

  it('puts availability before cost, since a gate decides whether a use happens', () => {
    expect(FEATURE_SLOT_NAMES.indexOf('mastery')).toBeLessThan(
      FEATURE_SLOT_NAMES.indexOf('cost'),
    );
    expect(FEATURE_SLOT_NAMES.indexOf('deed')).toBeLessThan(
      FEATURE_SLOT_NAMES.indexOf('cost'),
    );
  });

  it('gives a pool its own slots, sharing recharge with a feature', () => {
    expect(POOL_SLOT_NAMES).toEqual(['max', 'recharge']);
    expect(SLOT_NAMES.filter((name) => name === 'recharge')).toHaveLength(1);
  });

  it('shares one element and label for a name both hosts accept', () => {
    expect(HEIRLOOM_SLOT_NAMES).toContain('charges');
    expect(FEATURE_SLOT_NAMES).toContain('charges');
    expect(SLOT_ELEMENT_NAMES.charges).toBe('Charges');
    expect(SLOT_NAMES.filter((name) => name === 'charges')).toHaveLength(1);
    expect(HEIRLOOM_SLOT_NAMES).toContain('mastery');
    expect(FEATURE_SLOT_NAMES).toContain('mastery');
    expect(SLOT_NAMES.filter((name) => name === 'mastery')).toHaveLength(1);
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
