/**
 * @fileoverview Tests for the bloodline slot schema.
 * @description The two Core Features rows name the slots the card prints as
 * tables
 *
 * @module tests/unit/src/modules/library/domain/bloodlineSlots.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  BLOODLINE_SLOT_NAMES,
  BLOODLINE_SLOTS,
  BLOODLINE_TABLES,
  DEFAULT_BOON_POINTS,
} from '@/modules/library/domain/bloodlineSlots';
import {
  BLOODLINE_SLOTS as REEXPORTED,
  SLOT_ELEMENT_NAMES,
  SLOT_HOSTS,
  SLOT_NAMES,
} from '@/modules/library/domain/slots';
import { describe, expect, it } from 'vitest';

describe('BLOODLINE_SLOTS', () => {
  it('names an element for every slot, and lists them in schema order', () => {
    expect(BLOODLINE_SLOT_NAMES).toEqual([
      'abilityScores',
      'speeds',
      'senses',
      'size',
      'creatureTypes',
      'age',
    ]);
    for (const name of BLOODLINE_SLOT_NAMES) {
      expect(BLOODLINE_SLOTS[name]).toMatch(/^[A-Z]/);
    }
  });

  it('shares the senses and size elements a monster writes', () => {
    expect(BLOODLINE_SLOTS.senses).toBe('Senses');
    expect(BLOODLINE_SLOTS.size).toBe('Size');
  });

  it('covers every Core Features slot across its two rows', () => {
    const tabled = BLOODLINE_TABLES.flat();
    expect(tabled).toHaveLength(6);
    expect(new Set(tabled).size).toBe(6);
    expect([...tabled].sort()).toEqual([...BLOODLINE_SLOT_NAMES].sort());
  });

  it('states the budget every bloodline grants unless it says otherwise', () => {
    expect(DEFAULT_BOON_POINTS).toBe(10);
  });

  it('is reachable from the slot module, which registers the host and elements', () => {
    expect(REEXPORTED).toBe(BLOODLINE_SLOTS);
    expect(SLOT_HOSTS.Bloodline).toBe(BLOODLINE_SLOTS);
    for (const name of BLOODLINE_SLOT_NAMES) {
      expect(SLOT_NAMES).toContain(name);
      expect(SLOT_ELEMENT_NAMES[name]).toBe(BLOODLINE_SLOTS[name]);
    }
  });
});
