/**
 * @fileoverview Combatant Stats Grid Component
 * @description Renders editable ability score grid (STR, DEX, CON, INT, WIS, CHA)
 * with inline editing, keyboard navigation, and modifier display.
 * @module combatantStatsGrid
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CreatureStats } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import {
  clampNonNegative,
  getModifierString,
  parseIntSafe,
} from '../utils/statEditing';
import { useTranslations } from 'next-intl';
import { type MutableRefObject, useCallback, useState } from 'react';
import styles from './combatantRow.module.scss';
import { useCombatant } from './utils/context/combatantContext';

/**
 * Props for CombatantStatsGrid component.
 *
 * @interface CombatantStatsGridProps
 * @property {boolean} isLocked - Whether stats are locked from editing
 * @property {MutableRefObject<boolean>} cancelPendingRef - Shared ref for cancel state coordination
 */
export interface CombatantStatsGridProps {
  isLocked: boolean;
  cancelPendingRef: MutableRefObject<boolean>;
}

/**
 * Editable ability score grid for combatants.
 * Displays six ability scores with inline editing, Enter/Escape keyboard support,
 * and modifier display beneath each score.
 *
 * @component
 * @param {CombatantStatsGridProps} props - Component props
 * @param {boolean} props.isLocked - Whether stats are locked from editing
 * @param {MutableRefObject<boolean>} props.cancelPendingRef - Shared ref for cancel state
 * @returns {JSX.Element} Rendered stats grid
 */
export const CombatantStatsGrid: React.FC<CombatantStatsGridProps> = ({
  isLocked,
  cancelPendingRef,
}) => {
  const { combatant, updateStats } = useCombatant();
  const { stats } = combatant;
  const t = useTranslations('encounterPlanner');

  const [editingStats, setEditingStats] = useState<
    Record<string, string | null>
  >({});

  const handleStatChange = useCallback((stat: string, value: string) => {
    setEditingStats((prev) => ({ ...prev, [stat]: value }));
  }, []);

  const commitStat = useCallback(
    (stat: keyof CreatureStats) => {
      if (cancelPendingRef.current) {
        cancelPendingRef.current = false;
        return;
      }
      const editValue = editingStats[stat];
      if (editValue === undefined || editValue === null) return;
      const parsed = clampNonNegative(parseIntSafe(editValue, false)) ?? 1;
      const newStats = { ...stats, [stat]: parsed };
      updateStats(newStats);
      setEditingStats((prev) => ({ ...prev, [stat]: null }));
    },
    [editingStats, stats, updateStats, cancelPendingRef],
  );

  const cancelStat = useCallback(
    (stat: string) => {
      cancelPendingRef.current = true;
      setEditingStats((prev) => ({ ...prev, [stat]: null }));
    },
    [cancelPendingRef],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      commitFn: () => void,
      cancelFn: () => void,
    ) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitFn();
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelFn();
        e.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <div className={styles.statsSection}>
      {(Object.entries(stats) as [keyof CreatureStats, number][]).map(
        ([stat, value]) => {
          const isEditing =
            editingStats[stat] !== null && editingStats[stat] !== undefined;
          const displayValue = isEditing ? editingStats[stat] : String(value);

          return (
            <div key={stat} className={styles.statDisplay}>
              <div className={styles.statLabel}>{t(`stats.${stat}`)}</div>
              <input
                type='text'
                className={`${styles.statInput} ${isLocked ? styles.lockedInput : ''}`}
                value={displayValue ?? ''}
                onChange={(e) => handleStatChange(stat, e.target.value)}
                onFocus={() => handleStatChange(stat, String(value))}
                onBlur={() => commitStat(stat)}
                onKeyDown={(e) =>
                  handleKeyDown(
                    e,
                    () => commitStat(stat),
                    () => cancelStat(stat),
                  )
                }
                disabled={isLocked}
                aria-label={t(`stats.${stat}`)}
              />
              <div className={styles.statMod}>{getModifierString(value)}</div>
            </div>
          );
        },
      )}
    </div>
  );
};
