/**
 * @fileoverview Coin Pouch Component
 * @description Renders the character's coin holdings across one or more
 * currency systems. Built-in systems (e.g. `5e Standard`) are read-only at the
 * structural level — counts can be edited, but denominations cannot be added
 * or removed. Custom systems can be created at runtime; their denominations
 * are user-editable.
 *
 * Holdings are stored on `CharacterSheet.coinHoldings` keyed by `systemName`.
 * The component falls back to a single `5e Standard` holdings row when no
 * holdings are present, derived from the legacy `currency` field if needed.
 *
 * @module lib/components/characterSheet/coinPouch
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import {
  BUILT_IN_CURRENCY_SYSTEMS,
  FIVE_E_STANDARD,
  computeHoldingsValue,
  migrateLegacyCurrency,
} from '@/lib/data/currencySystems';
import type {
  CharacterCoinHoldings,
  CharacterSheet as CharacterSheetType,
  CurrencySystem,
} from '@/lib/types/character';
import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './coinPouch.module.scss';

/**
 * Props for `<CoinPouch>`.
 *
 * @interface CoinPouchProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface CoinPouchProps {
  data: CharacterSheetType;
  editing: boolean;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Resolves the active list of holdings, migrating legacy `currency` if needed.
 *
 * @function resolveHoldings
 * @param {CharacterSheetType} data - Character data
 * @returns {CharacterCoinHoldings[]} Effective holdings list
 */
const resolveHoldings = (
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
 * Coin pouch panel.
 *
 * @component
 * @param {CoinPouchProps} props - Component props
 * @returns {JSX.Element} Rendered pouch
 */
export const CoinPouch: React.FC<CoinPouchProps> = ({
  data,
  editing,
  onChange,
}) => {
  const holdings = resolveHoldings(data);

  const [customSystems, setCustomSystems] = useState<CurrencySystem[]>([]);

  const allSystems = useMemo<CurrencySystem[]>(
    () => [...BUILT_IN_CURRENCY_SYSTEMS, ...customSystems],
    [customSystems],
  );

  const findSystem = (name: string): CurrencySystem =>
    allSystems.find((s) => s.name === name) ?? FIVE_E_STANDARD;

  const updateHoldings = (next: CharacterCoinHoldings[]) => {
    onChange({ coinHoldings: next });
  };

  const updateCount = (
    systemName: string,
    coinName: string,
    raw: string,
  ) => {
    const value = Math.max(0, Number.parseInt(raw, 10) || 0);
    const next = holdings.map((h) =>
      h.systemName === systemName
        ? { ...h, counts: { ...h.counts, [coinName]: value } }
        : h,
    );
    updateHoldings(next);
  };

  const addSystem = () => {
    const remaining = BUILT_IN_CURRENCY_SYSTEMS.filter(
      (s) => !holdings.some((h) => h.systemName === s.name),
    );
    if (remaining.length > 0) {
      updateHoldings([
        ...holdings,
        { systemName: remaining[0].name, counts: {} },
      ]);
      return;
    }
    const customName = `Custom ${customSystems.length + 1}`;
    const newSystem: CurrencySystem = {
      name: customName,
      exchangeRate: 1,
      coins: [{ name: 'Unit', multiplier: 1 }],
      builtIn: false,
    };
    setCustomSystems((prev) => [...prev, newSystem]);
    updateHoldings([
      ...holdings,
      { systemName: customName, counts: { Unit: 0 } },
    ]);
  };

  const removeSystem = (systemName: string) => {
    updateHoldings(holdings.filter((h) => h.systemName !== systemName));
    setCustomSystems((prev) => prev.filter((s) => s.name !== systemName));
  };

  const addDenomination = (systemName: string) => {
    setCustomSystems((prev) =>
      prev.map((s) =>
        s.name === systemName
          ? {
              ...s,
              coins: [
                ...s.coins,
                { name: `Coin ${s.coins.length + 1}`, multiplier: 1 },
              ],
            }
          : s,
      ),
    );
  };

  return (
    <div className={styles.pouch}>
      <div className={styles.systemRow}>
        {holdings.map((h) => {
          const system = findSystem(h.systemName);
          const total = computeHoldingsValue(h, system);
          return (
            <div key={h.systemName} className={styles.systemCard}>
              <div className={styles.systemHeader}>
                <h4 className={styles.systemName}>{h.systemName}</h4>
                <Chip
                  label={`${total.toFixed(2)} ${system.coins.find((c) => c.multiplier === 1)?.abbreviation ?? 'units'}`}
                  variant='neutral'
                />
                {editing && !system.builtIn && (
                  <button
                    type='button'
                    className={styles.iconBtn}
                    onClick={() => removeSystem(h.systemName)}
                    aria-label={`Remove ${h.systemName}`}>
                    <X size={12} aria-hidden='true' />
                  </button>
                )}
              </div>
              <ul className={styles.denominationList}>
                {system.coins.map((coin) => (
                  <li key={coin.name} className={styles.denominationRow}>
                    <span className={styles.denominationName}>
                      {coin.name}
                      {coin.abbreviation ? ` (${coin.abbreviation})` : ''}
                    </span>
                    <input
                      type='number'
                      className={styles.countInput}
                      value={h.counts[coin.name] ?? 0}
                      min={0}
                      readOnly={!editing}
                      onChange={(e) =>
                        updateCount(h.systemName, coin.name, e.target.value)
                      }
                    />
                  </li>
                ))}
              </ul>
              {editing && !system.builtIn && (
                <button
                  type='button'
                  className={styles.iconBtn}
                  onClick={() => addDenomination(h.systemName)}
                  aria-label={`Add denomination to ${h.systemName}`}>
                  <Plus size={12} aria-hidden='true' />
                  <span>Add denomination</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <button
          type='button'
          className={styles.iconBtn}
          onClick={addSystem}
          aria-label='Add currency system'>
          <Plus size={14} aria-hidden='true' />
          <span>Add system</span>
        </button>
      )}
    </div>
  );
};
