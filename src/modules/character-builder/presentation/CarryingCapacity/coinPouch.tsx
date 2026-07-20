/**
 * @fileoverview Coin Pouch Component
 * @description Renders the character's coin holdings across one or more
 * currency systems. Built-in systems (e.g. `Gold Standard`) are read-only at the
 * structural level — counts can be edited, but denominations cannot be added
 * or removed. Custom systems can be created at runtime; their denominations
 * are user-editable.
 *
 * Holdings are stored on `CharacterSheet.coinHoldings` keyed by `systemName`.
 * The component falls back to a single `Gold Standard` holdings row when no
 * holdings are present, derived from the legacy `currency` field if needed.
 *
 * @module lib/components/characterSheet/coinPouch
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import { NumericInput } from '@/lib/components/ui/numericInput';
import { computeHoldingsValue } from '@/lib/data/currencySystems';
import type {
    CharacterCoinHoldings,
    CharacterSheet as CharacterSheetType,
    CurrencySystem,
} from '@/lib/types/character';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import {
    addCurrencySystem as addCurrencySystemState,
    addDenomination as addDenominationState,
    buildAllSystems,
    findSystem,
    removeCurrencySystem as removeCurrencySystemState,
    removeDenomination as removeDenominationState,
    renameCurrencySystem as renameCurrencySystemState,
    renameDenomination as renameDenominationState,
    resolveHoldings,
    updateCoinCount,
    updateDenominationMultiplier,
} from '../../infrastructure/coinPouch/coinPouch.helpers';
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
  const t = useTranslations('characterSheet.coinPouch');
  const holdings = resolveHoldings(data);

  const [customSystems, setCustomSystems] = useState<CurrencySystem[]>([]);

  const allSystems = useMemo(
    () => buildAllSystems(customSystems),
    [customSystems],
  );

  const updateHoldings = (next: CharacterCoinHoldings[]) => {
    onChange({ coinHoldings: next });
  };

  const updateCount = (systemName: string, coinName: string, raw: string) => {
    updateHoldings(updateCoinCount(holdings, systemName, coinName, raw));
  };

  const addSystem = () => {
    const result = addCurrencySystemState(holdings, customSystems);
    setCustomSystems(result.systems);
    updateHoldings(result.holdings);
  };

  const removeSystem = (systemName: string) => {
    const result = removeCurrencySystemState(
      holdings,
      customSystems,
      systemName,
    );
    setCustomSystems(result.systems);
    updateHoldings(result.holdings);
  };

  const addDenomination = (systemName: string) => {
    setCustomSystems((prev) => addDenominationState(prev, systemName));
  };

  const removeDenomination = (systemName: string, coinName: string) => {
    const result = removeDenominationState(
      holdings,
      customSystems,
      systemName,
      coinName,
    );
    setCustomSystems(result.systems);
    updateHoldings(result.holdings);
  };

  const renameDenomination = (
    systemName: string,
    oldName: string,
    newName: string,
  ) => {
    const result = renameDenominationState(
      holdings,
      customSystems,
      systemName,
      oldName,
      newName,
    );
    setCustomSystems(result.systems);
    updateHoldings(result.holdings);
  };

  const renameSystem = (oldName: string, newName: string) => {
    const result = renameCurrencySystemState(
      holdings,
      customSystems,
      oldName,
      newName,
    );
    setCustomSystems(result.systems);
    updateHoldings(result.holdings);
  };

  const updateMultiplier = (
    systemName: string,
    coinName: string,
    value: number,
  ) => {
    setCustomSystems((prev) =>
      updateDenominationMultiplier(prev, systemName, coinName, value),
    );
  };

  return (
    <div className={styles.pouch}>
      <div className={styles.systemRow}>
        {holdings.map((h) => {
          const system = findSystem(allSystems, h.systemName);
          const total = computeHoldingsValue(h, system);
          return (
            <div key={h.systemName} className={styles.systemCard}>
              <div className={styles.systemHeader}>
                {editing && !system.builtIn ? (
                  <input
                    className={styles.systemNameInput}
                    defaultValue={h.systemName}
                    onBlur={(e) => renameSystem(h.systemName, e.target.value)}
                    aria-label={t('systemNameAria')}
                  />
                ) : (
                  <h4 className={styles.systemName}>{h.systemName}</h4>
                )}
                <Chip
                  label={`${total.toFixed(2)} ${system.coins.find((c) => c.multiplier === 1)?.abbreviation ?? 'units'}`}
                  variant='neutral'
                />
                {editing && !system.builtIn && (
                  <button
                    type='button'
                    className={styles.iconBtn}
                    onClick={() => removeSystem(h.systemName)}
                    aria-label={t('removeAria', {
                      name: h.systemName,
                    })}>
                    <X size={12} aria-hidden='true' />
                  </button>
                )}
              </div>
              <ul className={styles.denominationList}>
                {system.coins.map((coin) => (
                  <li key={coin.name} className={styles.denominationRow}>
                    {editing && !system.builtIn ? (
                      <>
                        <input
                          className={styles.denominationNameInput}
                          defaultValue={coin.name}
                          onBlur={(e) =>
                            renameDenomination(
                              h.systemName,
                              coin.name,
                              e.target.value,
                            )
                          }
                          aria-label={t('denominationNameAria')}
                        />
                        <NumericInput
                          className={styles.multiplierInput}
                          value={coin.multiplier}
                          min={0.01}
                          step={0.01}
                          allowDecimals
                          size='sm'
                          ariaLabel={t('multiplierAria')}
                          onChange={(v) =>
                            updateMultiplier(h.systemName, coin.name, v ?? 1)
                          }
                        />
                        <button
                          type='button'
                          className={styles.iconBtn}
                          onClick={() =>
                            removeDenomination(h.systemName, coin.name)
                          }
                          aria-label={t('removeAria', {
                            name: coin.name,
                          })}>
                          <X size={10} aria-hidden='true' />
                        </button>
                      </>
                    ) : (
                      <span className={styles.denominationName}>
                        {coin.name}
                        {coin.abbreviation ? ` (${coin.abbreviation})` : ''}
                      </span>
                    )}
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
                  <span>{t('addDenomination')}</span>
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
          aria-label={t('addSystemAria')}>
          <Plus size={14} aria-hidden='true' />
          <span>{t('addSystem')}</span>
        </button>
      )}
    </div>
  );
};
