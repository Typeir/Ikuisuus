/**
 * @fileoverview Coin Pouch Component
 * @description Renders the character's coin holdings across currency systems,
 * keyed by `systemName` on `CharacterSheet.coinHoldings`. Built-in systems are
 * structurally read-only; custom systems allow editing of denominations.
 * Falls back to a single `Gold Standard` row when no holdings are present.
 *
 * @module modules/character-builder/presentation/CarryingCapacity/coinPouch
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
    CurrencySystem,
} from '@/lib/types/character';
import {
    useSheetData,
    useSheetEditing,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { IconButton } from '@/lib/components/ui/iconButton';
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
 * Coin pouch panel. Reads the character and edit mode from the active-sheet
 * context.
 *
 * @component
 * @returns {JSX.Element} Rendered pouch
 */
export const CoinPouch: React.FC = () => {
  const t = useTranslations('characterSheet.coinPouch');
  const data = useSheetData();
  const editing = useSheetEditing();
  const { patch } = useSheetMutators();
  const holdings = resolveHoldings(data);

  const [customSystems, setCustomSystems] = useState<CurrencySystem[]>([]);

  const allSystems = useMemo(
    () => buildAllSystems(customSystems),
    [customSystems],
  );

  const updateHoldings = (next: CharacterCoinHoldings[]) => {
    patch({ coinHoldings: next });
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
        {holdings.map((h, systemIndex) => {
          const system = findSystem(allSystems, h.systemName);
          const total = computeHoldingsValue(h, system);
          return (
            <div
              key={`${systemIndex}::${h.systemName}`}
              className={styles.systemCard}>
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
                  <IconButton
                    kind='close'
                    shape='rhombus'
                    label={t('removeAria', {
                      name: h.systemName,
                    })}
                    onClick={() => removeSystem(h.systemName)}
                  />
                )}
              </div>
              <ul className={styles.denominationList}>
                {system.coins.map((coin, coinIndex) => (
                  <li
                    key={`${coinIndex}::${coin.name}`}
                    className={styles.denominationRow}>
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
                          showChevrons
                          ariaLabel={t('multiplierAria')}
                          onChange={(v) =>
                            updateMultiplier(h.systemName, coin.name, v ?? 1)
                          }
                        />
                        <IconButton
                          kind='close'
                          shape='rhombus'
                          label={t('removeAria', {
                            name: coin.name,
                          })}
                          onClick={() =>
                            removeDenomination(h.systemName, coin.name)
                          }
                        />
                      </>
                    ) : (
                      <span className={styles.denominationName}>
                        {coin.name}
                        {coin.abbreviation ? ` (${coin.abbreviation})` : ''}
                      </span>
                    )}
                    {editing ? (
                      <NumericInput
                        className={styles.countInput}
                        value={h.counts[coin.name] ?? 0}
                        min={0}
                        size='sm'
                        showChevrons
                        ariaLabel={t('countAria', { name: coin.name })}
                        onChange={(v) =>
                          updateCount(h.systemName, coin.name, String(v ?? 0))
                        }
                      />
                    ) : (
                      <span className={styles.countValue}>
                        {h.counts[coin.name] ?? 0}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {editing && !system.builtIn && (
                <IconButton
                  kind='add'
                  dashed
                  size='s'
                  label={`Add denomination to ${h.systemName}`}
                  onClick={() => addDenomination(h.systemName)}>
                  {t('addDenomination')}
                </IconButton>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <IconButton
          kind='add'
          dashed
          label={t('addSystemAria')}
          onClick={addSystem}>
          {t('addSystem')}
        </IconButton>
      )}
    </div>
  );
};
