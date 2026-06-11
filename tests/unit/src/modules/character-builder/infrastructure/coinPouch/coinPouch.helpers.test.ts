/**
 * @fileoverview CoinPouch Helpers Tests
 * @description Unit tests for the coin pouch state transform helpers.
 *
 * @module tests/unit/lib/components/characterSheet/coinPouch.helpers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  addCurrencySystem,
  addDenomination,
  removeDenomination,
  renameDenomination,
  updateCoinCount,
  updateDenominationMultiplier,
} from '@/modules/character-builder/infrastructure/coinPouch/coinPouch.helpers';
import { describe, expect, it } from 'vitest';

describe('coinPouch.helpers', () => {
  it('adds a custom system when all built-ins already exist', () => {
    const holdings = [{ systemName: 'Gold Standard', counts: { Gold: 1 } }];
    const result = addCurrencySystem(holdings, []);
    expect(result.holdings[1].systemName).toBe('Custom 1');
    expect(result.systems[0].coins[0].name).toBe('Unit');
  });

  it('updates a count and preserves other denominations', () => {
    const holdings = [{ systemName: 'Gold Standard', counts: { Gold: 1 } }];
    const next = updateCoinCount(holdings, 'Gold Standard', 'Gold', '12');
    expect(next[0].counts.Gold).toBe(12);
  });

  it('renames a denomination and migrates holdings keys', () => {
    const holdings = [{ systemName: 'Custom', counts: { CoinA: 3 } }];
    const systems = [
      {
        name: 'Custom',
        exchangeRate: 1,
        coins: [{ name: 'CoinA', multiplier: 1 }],
        builtIn: false,
      },
    ];
    const result = renameDenomination(
      holdings,
      systems,
      'Custom',
      'CoinA',
      'Coin B',
    );
    expect(result.holdings[0].counts['Coin B']).toBe(3);
    expect(result.systems[0].coins[0].name).toBe('Coin B');
  });

  it('removes a denomination from both metadata and holdings', () => {
    const holdings = [{ systemName: 'Custom', counts: { CoinA: 3, CoinB: 4 } }];
    const systems = [
      {
        name: 'Custom',
        exchangeRate: 1,
        coins: [
          { name: 'CoinA', multiplier: 1 },
          { name: 'CoinB', multiplier: 2 },
        ],
        builtIn: false,
      },
    ];
    const result = removeDenomination(holdings, systems, 'Custom', 'CoinA');
    expect(result.holdings[0].counts.CoinA).toBeUndefined();
    expect(result.systems[0].coins).toHaveLength(1);
  });

  it('adds and updates custom denominations', () => {
    const systems = [
      {
        name: 'Custom',
        exchangeRate: 1,
        coins: [{ name: 'CoinA', multiplier: 1 }],
        builtIn: false,
      },
    ];
    const added = addDenomination(systems, 'Custom');
    expect(added[0].coins).toHaveLength(2);
    const updated = updateDenominationMultiplier(added, 'Custom', 'CoinA', 2.5);
    expect(updated[0].coins[0].multiplier).toBe(2.5);
  });
});
