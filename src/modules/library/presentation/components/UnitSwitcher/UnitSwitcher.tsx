/**
 * @fileoverview UnitSwitcher MDX Component
 * @description Lets a reader choose which system each measurement family
 * renders in. Distance, weight and volume are set independently, so someone
 * can read distances in metres while weighing things in pounds.
 *
 * Lives on the Measures rule page rather than in global chrome, so the page
 * that defines the units is also the page that changes them.
 *
 * Until the first client render commits, the hook reports the native defaults,
 * which is what the server rendered — so hydration has nothing to reconcile.
 *
 * @module modules/library/presentation/components/UnitSwitcher/UnitSwitcher
 * @version 2.0.0
 * @author Typeir
 * @since 2026-08-03
 */

'use client';

import {
  useUnitSystemActions,
  useUnitSystemState,
} from '@/lib/hooks/useUnitSystem';
import type {
  UnitDimension,
  UnitSystemValue,
} from '@/lib/types/persistentUiState';
import { useTranslations } from 'next-intl';
import React from 'react';
import styles from './UnitSwitcher.module.scss';

/** Selectable systems, in display order. */
const SYSTEMS: UnitSystemValue[] = ['stride', 'metric', 'imperial'];

/** Measurement families, in display order. */
const DIMENSIONS: UnitDimension[] = ['distance', 'weight', 'volume'];

/**
 * Builds the translation key for a system's label.
 *
 * @param {string} value - System or dimension value
 * @param {string} prefix - Key prefix
 * @returns {string} The translation key
 */
function labelKey(value: string, prefix: string): string {
  return `${prefix}${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

/**
 * Renders the unit system switcher, one row per measurement family.
 *
 * @returns {React.ReactElement} The rendered switcher
 */
export const UnitSwitcher: React.FC = () => {
  const { unitSystem } = useUnitSystemState();
  const { setUnitSystem } = useUnitSystemActions();
  const t = useTranslations('units');

  return (
    <div className={styles.switcher}>
      <p className={styles.label}>{t('switcherLabel')}</p>

      {DIMENSIONS.map((dimension) => {
        const groupId = `unit-switcher-${dimension}`;
        const active = unitSystem[dimension];

        return (
          <div className={styles.row} key={dimension}>
            <p className={styles.rowLabel} id={groupId}>
              {t(labelKey(dimension, 'dimension'))}
            </p>
            <div
              className={styles.options}
              role='radiogroup'
              aria-labelledby={groupId}>
              {SYSTEMS.map((system) => (
                <button
                  key={system}
                  type='button'
                  role='radio'
                  aria-checked={active === system}
                  className={styles.option}
                  data-active={active === system}
                  onClick={() => setUnitSystem(dimension, system)}>
                  {t(labelKey(system, 'switcher'))}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <p className={styles.hint}>{t('switcherHint')}</p>
    </div>
  );
};

export default UnitSwitcher;
