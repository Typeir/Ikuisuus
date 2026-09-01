/**
 * @fileoverview currencySystems Unit Tests
 * @description Tests for built-in currency systems registry + migration helper.
 *
 * @module tests/unit/src/lib/data/currencySystems.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    BUILT_IN_CURRENCY_SYSTEMS,
    GOLD_STANDARD,
    computeHoldingsValue,
    migrateLegacyCurrency,
} from '@/lib/data/currencySystems';
import { describe, expect, it } from 'vitest';

describe('currencySystems', () => {
  describe('GOLD_STANDARD', () => {
    it('contains the five canonical denominations', () => {
      const names = GOLD_STANDARD.coins.map((c) => c.name);
      expect(names).toEqual([
        'Copper',
        'Silver',
        'Electrum',
        'Gold',
        'Platinum',
      ]);
    });

    it('uses gold as the base unit (multiplier 1)', () => {
      const gold = GOLD_STANDARD.coins.find((c) => c.name === 'Gold');
      expect(gold?.multiplier).toBe(1);
    });

    it('is marked as built-in', () => {
      expect(GOLD_STANDARD.builtIn).toBe(true);
    });
  });

  describe('BUILT_IN_CURRENCY_SYSTEMS', () => {
    it('includes the Gold Standard system', () => {
      expect(BUILT_IN_CURRENCY_SYSTEMS).toContain(GOLD_STANDARD);
    });
  });

  describe('migrateLegacyCurrency', () => {
    it('maps every legacy denomination to its Gold Standard counterpart', () => {
      const result = migrateLegacyCurrency({
        pp: 1,
        gp: 2,
        ep: 3,
        sp: 4,
        cp: 5,
      });
      expect(result).toEqual({
        systemName: 'Gold Standard',
        counts: {
          Copper: 5,
          Silver: 4,
          Electrum: 3,
          Gold: 2,
          Platinum: 1,
        },
      });
    });

    it('treats missing fields as zero', () => {
      const result = migrateLegacyCurrency({
        pp: 0,
        gp: 0,
        ep: 0,
        sp: 0,
        cp: 0,
      });
      Object.values(result.counts).forEach((v) => expect(v).toBe(0));
    });
  });

  describe('computeHoldingsValue', () => {
    it('sums denominations against the system multipliers', () => {
      const value = computeHoldingsValue(
        {
          systemName: 'Gold Standard',
          counts: { Gold: 5, Silver: 30, Copper: 100 },
        },
        GOLD_STANDARD,
      );
      expect(value).toBeCloseTo(5 + 3 + 1, 5);
    });

    it('returns zero for empty holdings', () => {
      const value = computeHoldingsValue(
        { systemName: 'Gold Standard', counts: {} },
        GOLD_STANDARD,
      );
      expect(value).toBe(0);
    });
  });
});
