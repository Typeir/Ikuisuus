/**
 * @fileoverview Combat Stats Row Component
 * @description Displays the core combat statistics in a single horizontal row:
 * HP (current/max/temp) with a rollable hit dice panel, AC, initiative, speed
 * with a bloodline speed panel, and tier bonus.
 *
 * @module lib/components/characterSheet/combatStatsRow
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { VocationEntry } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { HitDiceCounter } from '@/modules/character-builder/presentation/atoms/hitDiceCounter';
import { HpRollerPanel } from '@/modules/character-builder/presentation/atoms/hpRollerPanel';
import { SpeedPanel } from '@/modules/character-builder/presentation/atoms/speedPanel';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';

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
 * @property {string[]} bloodlineSpeeds - All speed modes from the active bloodline
 * @property {number} tierBonus - tier bonus
 * @property {VocationEntry[]} vocations - Active vocation entries (used for hit dice counter)
 * @property {HitDieRollEntry[]} hitDiceLog - Hit die roll log for the HP roller panel
 * @property {number} conMod - CON modifier for HP roller calculations
 * @property {(updatedLog: HitDieRollEntry[], hpDelta: number) => void} onHitDiceCommit - Called when a roll is confirmed
 */
export interface CombatStatsRowProps {
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  ac: number;
  initiativeBonus: number;
  speedOverride: number | null;
  bloodlineSpeeds: string[];
  tierBonus: number;
  vocations: VocationEntry[];
  hitDiceLog: HitDieRollEntry[];
  conMod: number;
  onHitDiceCommit: (updatedLog: HitDieRollEntry[], hpDelta: number) => void;
}

/**
 * Horizontal bar of combat statistics.
 * Renders HP (with hit dice counter + roller), AC, initiative, speed (with
 * bloodline speed panel), and proficiency as labeled stat chips.
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
  bloodlineSpeeds,
  tierBonus,
  vocations,
  hitDiceLog,
  conMod,
  onHitDiceCommit,
}) => {
  const t = useTranslations('characterSheet');
  const initStr =
    initiativeBonus >= 0 ? `+${initiativeBonus}` : `${initiativeBonus}`;
  const pbStr =
    tierBonus >= 0 ? `+${tierBonus}` : `${tierBonus}`;
  const speedDisplay = speedOverride !== null ? `${speedOverride} ft.` : '—';

  return (
    <div
      className={styles.combatStatsRow}
      role='group'
      aria-label={t('ariaCombatStats')}>
      <div className={styles.statChip}>
        <HitDiceCounter vocations={vocations} />
        <div className={styles.statChipLabelRow}>
          <span className={styles.statChipLabel}>{t('hp')}</span>
          <HpRollerPanel
            hitDiceLog={hitDiceLog}
            conMod={conMod}
            onCommit={onHitDiceCommit}
          />
        </div>
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
        <div className={styles.statChipLabelRow}>
          <span className={styles.statChipLabel}>{t('speed')}</span>
          <SpeedPanel bloodlineSpeeds={bloodlineSpeeds} />
        </div>
        <span className={styles.statChipValue}>{speedDisplay}</span>
      </div>

      <div className={styles.statChip}>
        <span className={styles.statChipLabel}>{t('tierShort')}</span>
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
