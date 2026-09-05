/**
 * @fileoverview Tests for the item card layout tables.
 *
 * @module tests/unit/src/modules/library/domain/itemLayout.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import {
  ITEM_BRIEF_SLOTS,
  ITEM_ROW_SLOTS,
  STAT_SLOTS,
} from '@/modules/library/domain/itemLayout';
import { HEIRLOOM_SLOT_NAMES } from '@/modules/library/domain/slots';

describe('item layout', () => {
  it('places every item slot in the brief or in a row, never neither', () => {
    const placed = new Set([...ITEM_BRIEF_SLOTS, ...ITEM_ROW_SLOTS]);
    for (const name of HEIRLOOM_SLOT_NAMES) {
      expect(placed.has(name), name).toBe(true);
    }
  });

  it('places no slot in both', () => {
    const both = ITEM_BRIEF_SLOTS.filter((name) => ITEM_ROW_SLOTS.includes(name));
    expect(both).toEqual([]);
  });

  it('draws the stats row only from slots that also print as rows', () => {
    for (const name of STAT_SLOTS) {
      expect(ITEM_ROW_SLOTS, name).toContain(name);
    }
  });

  it('is reachable through the schema module as well', async () => {
    const slots = await import('@/modules/library/domain/slots');
    expect(slots.STAT_SLOTS).toBe(STAT_SLOTS);
    expect(slots.ITEM_ROW_SLOTS).toBe(ITEM_ROW_SLOTS);
  });
});
