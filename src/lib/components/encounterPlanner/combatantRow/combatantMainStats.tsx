/**
 * Combatant Main Stats Component
 *
 * @fileoverview Displays and allows inline editing of HP, AC, ability scores, initiative,
 * and slain toggle for combatants. All numeric fields support keyboard behavior:
 * Enter commits, Escape cancels, blur commits.
 *
 * @module combatantMainStats
 * @version 4.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for state, callbacks, refs
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/lib/types/encounterPlanner CreatureStats type definitions
 * @requires @/lib/types/inProgressCombat InProgressCombatant and related types
 * @requires ../playMode/CombatantContext useCombatant hook for context
 * @requires ../playMode/utils getPhaseMarker utility function
 *
 * @description
 * Extracted from CombatantRow for atomic composition. Manages all numeric stat editing
 * with inline validation and keyboard support. Includes the slain toggle checkbox.
 * Uses CombatantContext for centralized state management.
 */

'use client';

import type { CreatureStats } from '@/lib/types/encounterPlanner';
import { rollInitiative } from '@/lib/utils/encounterStorage';
import {
    clampNonNegative,
    getModifierString,
    parseIntSafe,
} from '@/lib/utils/statEditing';
import { Dices } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import styles from './combatantRow.module.scss';
import { getPhaseMarker } from './utils';
import { useCombatant } from './utils/context/combatantContext';

/**
 * Props for CombatantMainStats component.
 * All props are optional when used within CombatantProvider (values come from context).
 *
 * @interface CombatantMainStatsProps
 * @property {boolean} [showSlain=true] - Whether to show the slain toggle
 * @property {string[]} [locked] - Array of locked field names
 */
export interface CombatantMainStatsProps {
  showSlain?: boolean;
  locked?: string[];
}

/**
 * Main stats section for Play Mode combatants.
 * Displays editable HP inputs, AC, ability scores with modifiers, initiative, and slain checkbox.
 * Supports keyboard navigation: Enter commits, Escape cancels, blur commits.
 * Uses CombatantContext for state and update functions.
 *
 * @component
 * @param {CombatantMainStatsProps} props - Component props
 * @param {boolean} [props.showSlain] - Whether to show the slain checkbox
 * @param {string[]} [props.locked] - Array of locked field names
 * @returns {JSX.Element} Rendered main stats section
 *
 * @example
 * // Within CombatantProvider
 * <CombatantMainStats />
 *
 * @example
 * // With optional overrides
 * <CombatantMainStats showSlain={false} locked={['stats']} />
 */
export const CombatantMainStats: React.FC<CombatantMainStatsProps> = ({
  showSlain = true,
  locked = [],
}) => {
  const { combatant, onUpdate, updateField, updateStats, disableLocking } =
    useCombatant();
  const {
    hpCurrent,
    hpMax,
    hpMaxOverride = null,
    tempHp,
    ac,
    stats,
    initiativeValue,
    initiativeBonus,
    slain = false,
  } = combatant;

  const t = useTranslations('encounterPlanner');

  const isStatsLocked = disableLocking
    ? false
    : (locked ?? []).includes('stats');

  const effectiveHpMax = hpMaxOverride !== null ? hpMaxOverride : hpMax;
  const phaseMarker = getPhaseMarker(hpCurrent, effectiveHpMax);

  const [editingHpMax, setEditingHpMax] = useState<string | null>(null);
  const [editingAc, setEditingAc] = useState<string | null>(null);
  const [editingInit, setEditingInit] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState<
    Record<string, string | null>
  >({});

  const cancelPendingRef = useRef(false);
  const hpMaxInputRef = useRef<HTMLInputElement>(null);
  const acInputRef = useRef<HTMLInputElement>(null);
  const initInputRef = useRef<HTMLInputElement>(null);

  const handleToggleSlain = useCallback(() => {
    const newSlain = !slain;
    if (newSlain) {
      onUpdate({ ...combatant, slain: true, hpCurrent: 0 });
    } else {
      updateField('slain', false);
    }
  }, [combatant, slain, onUpdate, updateField]);

  /**
   * Handles HP Max edit. When hpMaxOverride is in use, edits that field;
   * otherwise edits hpMax directly.
   */
  const handleHpMaxChange = useCallback((value: string) => {
    setEditingHpMax(value);
  }, []);

  const commitHpMax = useCallback(() => {
    if (cancelPendingRef.current) {
      cancelPendingRef.current = false;
      return;
    }
    if (editingHpMax === null) return;
    const parsed = clampNonNegative(parseIntSafe(editingHpMax, false)) ?? 1;
    if (hpMaxOverride !== null) {
      updateField('hpMaxOverride', parsed);
    } else {
      updateField('hpMax', parsed);
    }
    setEditingHpMax(null);
  }, [editingHpMax, hpMaxOverride, updateField]);

  const cancelHpMax = useCallback(() => {
    cancelPendingRef.current = true;
    setEditingHpMax(null);
  }, []);

  const handleAcChange = useCallback((value: string) => {
    setEditingAc(value);
  }, []);

  const commitAc = useCallback(() => {
    if (cancelPendingRef.current) {
      cancelPendingRef.current = false;
      return;
    }
    if (editingAc === null) return;
    const parsed = clampNonNegative(parseIntSafe(editingAc, false)) ?? 0;
    updateField('ac', parsed);
    setEditingAc(null);
  }, [editingAc, updateField]);

  const cancelAc = useCallback(() => {
    cancelPendingRef.current = true;
    setEditingAc(null);
  }, []);

  const handleInitChange = useCallback((value: string) => {
    setEditingInit(value);
  }, []);

  const handleRollInitiative = useCallback(() => {
    const rolled = rollInitiative(initiativeBonus);
    updateField('initiativeValue', rolled);
    setEditingInit(null);
  }, [initiativeBonus, updateField]);

  const commitInit = useCallback(() => {
    if (cancelPendingRef.current) {
      cancelPendingRef.current = false;
      return;
    }
    if (editingInit === null) return;
    const parsed = parseIntSafe(editingInit, true);
    updateField('initiativeValue', parsed);
    setEditingInit(null);
  }, [editingInit, updateField]);

  const cancelInit = useCallback(() => {
    cancelPendingRef.current = true;
    setEditingInit(null);
  }, []);

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
    [editingStats, stats, updateStats],
  );

  const cancelStat = useCallback((stat: string) => {
    cancelPendingRef.current = true;
    setEditingStats((prev) => ({ ...prev, [stat]: null }));
  }, []);

  /**
   * Keyboard handler for editable fields.
   * Enter commits, Escape cancels.
   */
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
    <div className={styles.mainRow}>
      <div className={styles.hpSection}>
        <label className={styles.label}>{t('hp')}</label>
        <div className={styles.hpInputs}>
          <input
            type='text'
            className={styles.numberInput}
            value={hpCurrent}
            onChange={(e) => {
              const parsed =
                clampNonNegative(parseIntSafe(e.target.value, false)) ?? 0;
              updateField('hpCurrent', parsed);
            }}
            placeholder={t('current')}
            aria-label={t('hpCurrent')}
          />
          <span>/</span>
          <input
            ref={hpMaxInputRef}
            type='text'
            className={`${styles.numberInput} ${isStatsLocked ? styles.lockedInput : ''}`}
            value={editingHpMax !== null ? editingHpMax : effectiveHpMax}
            onChange={(e) => handleHpMaxChange(e.target.value)}
            onFocus={() => setEditingHpMax(String(effectiveHpMax))}
            onBlur={commitHpMax}
            onKeyDown={(e) => handleKeyDown(e, commitHpMax, cancelHpMax)}
            disabled={isStatsLocked}
            placeholder={t('max')}
            aria-label={t('hpMax')}
          />
          <span>+</span>
          <input
            type='text'
            className={styles.numberInput}
            value={tempHp !== null ? tempHp : ''}
            onChange={(e) => {
              const parsed = parseIntSafe(e.target.value, true);
              updateField('tempHp', clampNonNegative(parsed));
            }}
            placeholder={t('temp')}
            aria-label={t('tempHp')}
          />
          {phaseMarker && (
            <span className={`${styles.phaseBadge} ${styles[phaseMarker]}`}>
              {phaseMarker}
            </span>
          )}
        </div>
      </div>

      {showSlain && (
        <div className={styles.slainSection}>
          <label className={styles.label}>{t('slain')}</label>
          <input
            type='checkbox'
            className={styles.slainCheckbox}
            checked={slain}
            onChange={handleToggleSlain}
            aria-label={t('slain')}
          />
        </div>
      )}

      <div className={styles.acSection}>
        <label className={styles.label}>{t('ac')}</label>
        <input
          ref={acInputRef}
          type='text'
          className={`${styles.numberInput} ${styles.acInput} ${isStatsLocked ? styles.lockedInput : ''}`}
          value={editingAc !== null ? editingAc : ac}
          onChange={(e) => handleAcChange(e.target.value)}
          onFocus={() => setEditingAc(String(ac))}
          onBlur={commitAc}
          onKeyDown={(e) => handleKeyDown(e, commitAc, cancelAc)}
          disabled={isStatsLocked}
          aria-label={t('ac')}
        />
      </div>

      <div className={styles.initiativeSection}>
        <div className={styles.initiativeField}>
          <label className={styles.label}>{t('initiative')}</label>
          <input
            ref={initInputRef}
            type='text'
            className={`${styles.numberInput} ${isStatsLocked ? styles.lockedInput : ''}`}
            value={
              editingInit !== null
                ? editingInit
                : initiativeValue !== null
                  ? String(initiativeValue)
                  : ''
            }
            onChange={(e) => handleInitChange(e.target.value)}
            onFocus={() =>
              setEditingInit(
                initiativeValue !== null ? String(initiativeValue) : '',
              )
            }
            onBlur={commitInit}
            onKeyDown={(e) => handleKeyDown(e, commitInit, cancelInit)}
            disabled={isStatsLocked}
            placeholder='—'
            aria-label={t('initiative')}
          />
        </div>
        <button
          onClick={handleRollInitiative}
          disabled={isStatsLocked}
          className={styles.rollInitiativeButton}
          title={t('rollInitiative')}
          aria-label={t('rollInitiative')}>
          <Dices size={18} aria-hidden='true' />
        </button>
      </div>

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
                  className={`${styles.statInput} ${isStatsLocked ? styles.lockedInput : ''}`}
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
                  disabled={isStatsLocked}
                  aria-label={t(`stats.${stat}`)}
                />
                <div className={styles.statMod}>{getModifierString(value)}</div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
};
