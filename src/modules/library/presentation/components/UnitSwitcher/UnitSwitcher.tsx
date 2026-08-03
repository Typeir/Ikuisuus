/**
 * @fileoverview UnitSwitcher MDX Component
 * @description Lets a reader choose which system every measure in the Library
 * renders in. Lives on the Measures rule page rather than in global chrome, so
 * the page that defines the units is also the page that changes them.
 *
 * Renders the native stride option as selected until persistent state has
 * hydrated, matching the server-rendered default.
 *
 * @module modules/library/presentation/components/UnitSwitcher/UnitSwitcher
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

'use client';

import {
  useUnitSystemActions,
  useUnitSystemState,
} from '@/lib/hooks/useUnitSystem';
import type { UnitSystemValue } from '@/lib/types/persistentUiState';
import { useTranslations } from 'next-intl';
import React from 'react';
import styles from './UnitSwitcher.module.scss';

/**
 * Selectable systems in display order.
 *
 * @constant
 */
const SYSTEMS: UnitSystemValue[] = ['stride', 'metric', 'imperial'];

/**
 * Maps a system to its translation key suffix.
 *
 * @param {UnitSystemValue} system - The system value
 * @returns {string} The translation key for the system's label
 */
function labelKey(system: UnitSystemValue): string {
  return `switcher${system.charAt(0).toUpperCase()}${system.slice(1)}`;
}

/**
 * Renders the unit system switcher.
 *
 * @returns {React.ReactElement} The rendered switcher
 */
export const UnitSwitcher: React.FC = () => {
  const { unitSystem, isHydrated } = useUnitSystemState();
  const { setUnitSystem } = useUnitSystemActions();
  const t = useTranslations('units');

  const active = isHydrated ? unitSystem : 'stride';

  return (
    <div className={styles.switcher}>
      <p className={styles.label} id='unit-switcher-label'>
        {t('switcherLabel')}
      </p>
      <div
        className={styles.options}
        role='radiogroup'
        aria-labelledby='unit-switcher-label'
      >
        {SYSTEMS.map((system) => (
          <button
            key={system}
            type='button'
            role='radio'
            aria-checked={active === system}
            className={styles.option}
            data-active={active === system}
            onClick={() => setUnitSystem(system)}
          >
            {t(labelKey(system))}
          </button>
        ))}
      </div>
      <p className={styles.hint}>{t('switcherHint')}</p>
    </div>
  );
};

export default UnitSwitcher;
