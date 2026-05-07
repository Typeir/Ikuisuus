/**
 * @fileoverview Built-in Currency Systems Registry
 * @description Bundles the canonical 5e Standard coinage table. Custom systems
 * may be added at runtime via local state — this module exposes only the
 * read-only built-ins, and helpers for legacy migration.
 *
 * @module lib/data/currencySystems
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
  CharacterCoinHoldings,
  CharacterCurrency,
  CurrencySystem,
} from '@/lib/types/character';

/**
 * Canonical 5e standard coinage. Multipliers are expressed in gold-piece units
 * (gp is the base, multiplier = 1).
 */
export const FIVE_E_STANDARD: CurrencySystem = {
  name: '5e Standard',
  exchangeRate: 1,
  coins: [
    { name: 'Copper', abbreviation: 'cp', multiplier: 0.01 },
    { name: 'Silver', abbreviation: 'sp', multiplier: 0.1 },
    { name: 'Electrum', abbreviation: 'ep', multiplier: 0.5 },
    { name: 'Gold', abbreviation: 'gp', multiplier: 1 },
    { name: 'Platinum', abbreviation: 'pp', multiplier: 10 },
  ],
  builtIn: true,
};

/**
 * Built-in systems shipped with the application. Not user-editable.
 */
export const BUILT_IN_CURRENCY_SYSTEMS: CurrencySystem[] = [FIVE_E_STANDARD];

/**
 * Maps legacy `CharacterCurrency` (pp/gp/ep/sp/cp) into a single
 * `CharacterCoinHoldings` entry against the `5e Standard` system.
 *
 * @function migrateLegacyCurrency
 * @param {CharacterCurrency} legacy - Old-shape currency object
 * @returns {CharacterCoinHoldings} New holdings entry
 */
export const migrateLegacyCurrency = (
  legacy: CharacterCurrency,
): CharacterCoinHoldings => ({
  systemName: FIVE_E_STANDARD.name,
  counts: {
    Copper: legacy.cp ?? 0,
    Silver: legacy.sp ?? 0,
    Electrum: legacy.ep ?? 0,
    Gold: legacy.gp ?? 0,
    Platinum: legacy.pp ?? 0,
  },
});

/**
 * Computes the total value of a holdings entry in base units of its system.
 *
 * @function computeHoldingsValue
 * @param {CharacterCoinHoldings} holdings - The holdings entry
 * @param {CurrencySystem} system - The system definition
 * @returns {number} Total value in base units (e.g. gold pieces)
 */
export const computeHoldingsValue = (
  holdings: CharacterCoinHoldings,
  system: CurrencySystem,
): number => {
  let total = 0;
  for (const coin of system.coins) {
    const count = holdings.counts[coin.name] ?? 0;
    total += count * coin.multiplier;
  }
  return total;
};
