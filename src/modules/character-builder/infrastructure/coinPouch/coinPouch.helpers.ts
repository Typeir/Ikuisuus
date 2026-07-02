/**
 * @fileoverview Coin Pouch Helpers
 * @description Pure data transforms for currency-system management in the
 * character sheet coin pouch.
 *
 * @module lib/components/characterSheet/coinPouch.helpers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  BUILT_IN_CURRENCY_SYSTEMS,
  GOLD_STANDARD,
  migrateLegacyCurrency,
} from '@/lib/data/currencySystems';
import type {
  CharacterCoinHoldings,
  CharacterSheet as CharacterSheetType,
  CurrencySystem,
} from '@/lib/types/character';

/**
 * Result tuple for coin-pouch state mutations.
 *
 * @interface CoinPouchMutationResult
 * @property {CharacterCoinHoldings[]} holdings - Next holdings state
 * @property {CurrencySystem[]} systems - Next custom system state
 */
export interface CoinPouchMutationResult {
  holdings: CharacterCoinHoldings[];
  systems: CurrencySystem[];
}

/**
 * Resolve the effective holdings list for a character.
 *
 * @function resolveHoldings
 * @param {CharacterSheetType} data - Character data
 * @returns {CharacterCoinHoldings[]} Effective holdings list
 */
export const resolveHoldings = (
  data: CharacterSheetType,
): CharacterCoinHoldings[] => {
  if (Array.isArray(data.coinHoldings) && data.coinHoldings.length > 0) {
    return data.coinHoldings;
  }
  if (data.currency) {
    return [migrateLegacyCurrency(data.currency)];
  }
  return [];
};

/**
 * Combine built-in and custom systems into a single lookup list.
 *
 * @function buildAllSystems
 * @param {CurrencySystem[]} customSystems - User-defined currency systems
 * @returns {CurrencySystem[]} Combined systems
 */
export const buildAllSystems = (
  customSystems: CurrencySystem[],
): CurrencySystem[] => [...BUILT_IN_CURRENCY_SYSTEMS, ...customSystems];

/**
 * Find a currency system by name, falling back to Gold Standard.
 *
 * @function findSystem
 * @param {CurrencySystem[]} systems - Candidate systems
 * @param {string} name - Requested system name
 * @returns {CurrencySystem} Matching system or the default fallback
 */
export const findSystem = (
  systems: CurrencySystem[],
  name: string,
): CurrencySystem =>
  systems.find((system) => system.name === name) ?? GOLD_STANDARD;

/**
 * Update the quantity of a single coin denomination.
 *
 * @function updateCoinCount
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {string} systemName - Currency system name
 * @param {string} coinName - Denomination name
 * @param {string} raw - Raw input value
 * @returns {CharacterCoinHoldings[]} Next holdings state
 */
export const updateCoinCount = (
  holdings: CharacterCoinHoldings[],
  systemName: string,
  coinName: string,
  raw: string,
): CharacterCoinHoldings[] => {
  const value = Math.max(0, Number.parseInt(raw, 10) || 0);
  return holdings.map((holding) =>
    holding.systemName === systemName
      ? { ...holding, counts: { ...holding.counts, [coinName]: value } }
      : holding,
  );
};

/**
 * Add a built-in or custom currency system.
 *
 * @function addCurrencySystem
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @returns {CoinPouchMutationResult} Updated state payload
 */
export const addCurrencySystem = (
  holdings: CharacterCoinHoldings[],
  customSystems: CurrencySystem[],
): CoinPouchMutationResult => {
  const remainingBuiltIn = BUILT_IN_CURRENCY_SYSTEMS.find(
    (system) => !holdings.some((holding) => holding.systemName === system.name),
  );
  if (remainingBuiltIn) {
    return {
      holdings: [
        ...holdings,
        { systemName: remainingBuiltIn.name, counts: {} },
      ],
      systems: customSystems,
    };
  }

  const customName = `Custom ${customSystems.length + 1}`;
  return {
    holdings: [...holdings, { systemName: customName, counts: { Unit: 0 } }],
    systems: [
      ...customSystems,
      {
        name: customName,
        exchangeRate: 1,
        coins: [{ name: 'Unit', multiplier: 1 }],
        builtIn: false,
      },
    ],
  };
};

/**
 * Remove a currency system from holdings and custom definitions.
 *
 * @function removeCurrencySystem
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @returns {CoinPouchMutationResult} Updated state payload
 */
export const removeCurrencySystem = (
  holdings: CharacterCoinHoldings[],
  customSystems: CurrencySystem[],
  systemName: string,
): CoinPouchMutationResult => ({
  holdings: holdings.filter((holding) => holding.systemName !== systemName),
  systems: customSystems.filter((system) => system.name !== systemName),
});

/**
 * Add a denomination to a custom currency system.
 *
 * @function addDenomination
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @returns {CurrencySystem[]} Updated custom systems
 */
export const addDenomination = (
  customSystems: CurrencySystem[],
  systemName: string,
): CurrencySystem[] =>
  customSystems.map((system) =>
    system.name === systemName
      ? {
          ...system,
          coins: [
            ...system.coins,
            { name: `Coin ${system.coins.length + 1}`, multiplier: 1 },
          ],
        }
      : system,
  );

/**
 * Remove a denomination and drop any corresponding holdings count.
 *
 * @function removeDenomination
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @param {string} coinName - Denomination name
 * @returns {CoinPouchMutationResult} Updated state payload
 */
export const removeDenomination = (
  holdings: CharacterCoinHoldings[],
  customSystems: CurrencySystem[],
  systemName: string,
  coinName: string,
): CoinPouchMutationResult => ({
  holdings: holdings.map((holding) =>
    holding.systemName === systemName
      ? {
          ...holding,
          counts: Object.fromEntries(
            Object.entries(holding.counts).filter(([key]) => key !== coinName),
          ),
        }
      : holding,
  ),
  systems: customSystems.map((system) =>
    system.name === systemName
      ? {
          ...system,
          coins: system.coins.filter((coin) => coin.name !== coinName),
        }
      : system,
  ),
});

/**
 * Rename a denomination and migrate existing holdings keys.
 *
 * @function renameDenomination
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @param {string} oldName - Existing denomination name
 * @param {string} newName - Replacement denomination name
 * @returns {CoinPouchMutationResult} Updated state payload
 */
export const renameDenomination = (
  holdings: CharacterCoinHoldings[],
  customSystems: CurrencySystem[],
  systemName: string,
  oldName: string,
  newName: string,
): CoinPouchMutationResult => {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) {
    return { holdings, systems: customSystems };
  }
  const system = customSystems.find((entry) => entry.name === systemName);
  if (system?.coins.some((coin) => coin.name === trimmed)) {
    return { holdings, systems: customSystems };
  }
  return {
    holdings: holdings.map((holding) =>
      holding.systemName === systemName
        ? {
            ...holding,
            counts: Object.fromEntries(
              Object.entries(holding.counts).map(([key, value]) => [
                key === oldName ? trimmed : key,
                value,
              ]),
            ),
          }
        : holding,
    ),
    systems: customSystems.map((entry) =>
      entry.name === systemName
        ? {
            ...entry,
            coins: entry.coins.map((coin) =>
              coin.name === oldName ? { ...coin, name: trimmed } : coin,
            ),
          }
        : entry,
    ),
  };
};

/**
 * Update the multiplier of a custom denomination.
 *
 * @function updateDenominationMultiplier
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @param {string} coinName - Denomination name
 * @param {number} value - New multiplier value
 * @returns {CurrencySystem[]} Updated custom systems
 */
/**
 * Rename a custom currency system and migrate holdings keys.
 *
 * @function renameCurrencySystem
 * @param {CharacterCoinHoldings[]} holdings - Current holdings
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} oldName - Existing system name
 * @param {string} newName - Replacement system name
 * @returns {CoinPouchMutationResult} Updated state payload
 */
export const renameCurrencySystem = (
  holdings: CharacterCoinHoldings[],
  customSystems: CurrencySystem[],
  oldName: string,
  newName: string,
): CoinPouchMutationResult => {
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) {
    return { holdings, systems: customSystems };
  }
  return {
    holdings: holdings.map((h) =>
      h.systemName === oldName ? { ...h, systemName: trimmed } : h,
    ),
    systems: customSystems.map((s) =>
      s.name === oldName ? { ...s, name: trimmed } : s,
    ),
  };
};

/**
 * Update the multiplier of a custom denomination.
 *
 * @function updateDenominationMultiplier
 * @param {CurrencySystem[]} customSystems - Current custom systems
 * @param {string} systemName - Currency system name
 * @param {string} coinName - Denomination name
 * @param {number} value - New multiplier value
 * @returns {CurrencySystem[]} Updated custom systems
 */
export const updateDenominationMultiplier = (
  customSystems: CurrencySystem[],
  systemName: string,
  coinName: string,
  value: number,
): CurrencySystem[] =>
  customSystems.map((system) =>
    system.name === systemName
      ? {
          ...system,
          coins: system.coins.map((coin) =>
            coin.name === coinName
              ? { ...coin, multiplier: Math.max(0.01, value) }
              : coin,
          ),
        }
      : system,
  );
