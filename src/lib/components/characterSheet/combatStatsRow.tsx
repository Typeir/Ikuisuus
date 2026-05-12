/**
 * @fileoverview Combat Stats Row Component
 * @description Displays the core combat statistics in a single horizontal row:
 * HP (current/max/temp), AC, initiative, speed, and proficiency bonus.
 *
 * @module lib/components/characterSheet/combatStatsRow
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from './characterSheet.module.scss';

/**
 * Props for the CombatStatsRow component.
 *
 * @interface CombatStatsRowProps
 * @property {number} hpCurrent - Current hit points
 * @property {number} hpMax - Maximum hit points
 * @property {number} tempHp - Temporary hit points
 * @property {number} ac - Armor class
 * @property {number} initiativeBonus - Initiative modifier
 * @property {number | null} speedOverride - Movement speed override in feet; null means use default
 * @property {number} proficiencyBonus - Proficiency bonus
 */
export interface CombatStatsRowProps {
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  ac: number;
  initiativeBonus: number;
  speedOverride: number | null;
  proficiencyBonus: number;
}

/**
 * Horizontal bar of combat statistics.
 * Renders HP, AC, initiative, speed, and proficiency as labeled stat chips.
 *
 * @component
 * @param {CombatStatsRowProps} props - Component props
 * @returns {JSX.Element} Rendered combat stats row
 */
export const CombatStatsRowImpl: React.FC<CombatStatsRowProps> = ({
  hpCurrent,
  hpMax,
  tempHp,
  ac,
  initiativeBonus,
  speedOverride,
  proficiencyBonus,
}) => {
  const t = useTranslations('characterSheet');
  const initStr =
    initiativeBonus >= 0 ? `+${initiativeBonus}` : `${initiativeBonus}`;
  const pbStr =
    proficiencyBonus >= 0 ? `+${proficiencyBonus}` : `${proficiencyBonus}`;
  const speedDisplay = speedOverride !== null ? `${speedOverride} ft.` : '—';

  return (
    <div
      className={styles.combatStatsRow}
      role='group'
      aria-label={t('ariaCombatStats')}>
      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('hp')}</span>
        <span
          className={styles.statChipValue}
          aria-label={t('ariaHp', {
            current: hpCurrent,
            max: hpMax,
            temp: tempHp,
          })}>
          {hpCurrent}/{hpMax}
          {tempHp > 0 && <span className={styles.tempHp}> +{tempHp}</span>}
        </span>
      </div>

      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('ac')}</span>
        <span className={styles.statChipValue}>{ac}</span>
      </div>

      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('initiative')}</span>
        <span className={styles.statChipValue}>{initStr}</span>
      </div>

      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('speed')}</span>
        <span className={styles.statChipValue}>{speedDisplay}</span>
      </div>

      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('proficiencyShort')}</span>
        <span className={styles.statChipValue}>{pbStr}</span>
      </div>
    </div>
  );
};

/**
 * Memoized `CombatStatsRow` export. Re-renders only when one of its scalar
 * stat props changes — typing in the name field at the sheet root no longer
 * re-renders the combat stat chips.
 */
export const CombatStatsRow = memo(CombatStatsRowImpl);
