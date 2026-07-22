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
 * @requires @/modules/encounter-planner/domain/encounters/encounter.types CreatureStats type definitions
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types InProgressCombatant and related types
 * @requires ../playMode/CombatantContext useCombatant hook for context
 * @requires ../playMode/utils getPhaseMarker utility function
 *
 * @description
 * Extracted from CombatantRow for atomic composition. Manages all numeric stat editing
 * with inline validation and keyboard support. Includes the slain toggle checkbox.
 * Uses CombatantContext for centralized state management.
 */

'use client';

import { rollInitiative } from '@/modules/encounter-planner/domain/shared/utils';
import { clampNonNegative, parseIntSafe } from '../utils/statEditing';
import { Dices } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef } from 'react';
import styles from './combatantRow.module.scss';
import btn from '@/styles/buttons.module.scss';
import { CombatantStatsGrid } from './combatantStatsGrid';
import { getPhaseMarker } from './utils';
import { useCombatant } from './utils/context/combatantContext';
import { useEditableField } from './utils/useEditableField';

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
  const { combatant, onUpdate, updateField, disableLocking } = useCombatant();
  const {
    hpCurrent,
    hpMax,
    hpMaxOverride = null,
    tempHp,
    ac,
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

  const cancelPendingRef = useRef(false);

  const handleToggleSlain = useCallback(() => {
    const newSlain = !slain;
    if (newSlain) {
      onUpdate({ ...combatant, slain: true, hpCurrent: 0 });
    } else {
      updateField('slain', false);
    }
  }, [combatant, slain, onUpdate, updateField]);

  const hpMaxField = useEditableField(
    cancelPendingRef,
    useCallback(
      (value: string) => {
        const parsed = clampNonNegative(parseIntSafe(value, false)) ?? 1;
        updateField(hpMaxOverride !== null ? 'hpMaxOverride' : 'hpMax', parsed);
      },
      [hpMaxOverride, updateField],
    ),
  );

  const acField = useEditableField(
    cancelPendingRef,
    useCallback(
      (value: string) => {
        const parsed = clampNonNegative(parseIntSafe(value, false)) ?? 0;
        updateField('ac', parsed);
      },
      [updateField],
    ),
  );

  const initField = useEditableField(
    cancelPendingRef,
    useCallback(
      (value: string) => {
        const parsed = parseIntSafe(value, true);
        updateField('initiativeValue', parsed);
      },
      [updateField],
    ),
  );

  const handleRollInitiative = useCallback(() => {
    const rolled = rollInitiative(initiativeBonus);
    updateField('initiativeValue', rolled);
    initField.setEditing('');
  }, [initiativeBonus, updateField, initField]);

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
            type='text'
            className={`${styles.numberInput} ${isStatsLocked ? styles.lockedInput : ''}`}
            value={
              hpMaxField.editing !== null ? hpMaxField.editing : effectiveHpMax
            }
            onChange={(e) => hpMaxField.onChange(e.target.value)}
            onFocus={() => hpMaxField.setEditing(String(effectiveHpMax))}
            onBlur={hpMaxField.commit}
            onKeyDown={(e) =>
              handleKeyDown(e, hpMaxField.commit, hpMaxField.cancel)
            }
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
          type='text'
          className={`${styles.numberInput} ${styles.acInput} ${isStatsLocked ? styles.lockedInput : ''}`}
          value={acField.editing !== null ? acField.editing : ac}
          onChange={(e) => acField.onChange(e.target.value)}
          onFocus={() => acField.setEditing(String(ac))}
          onBlur={acField.commit}
          onKeyDown={(e) => handleKeyDown(e, acField.commit, acField.cancel)}
          disabled={isStatsLocked}
          aria-label={t('ac')}
        />
      </div>

      <div className={styles.initiativeSection}>
        <div className={styles.initiativeField}>
          <label className={styles.label}>{t('initiative')}</label>
          <input
            type='text'
            className={`${styles.numberInput} ${isStatsLocked ? styles.lockedInput : ''}`}
            value={
              initField.editing !== null
                ? initField.editing
                : initiativeValue !== null
                  ? String(initiativeValue)
                  : ''
            }
            onChange={(e) => initField.onChange(e.target.value)}
            onFocus={() =>
              initField.setEditing(
                initiativeValue !== null ? String(initiativeValue) : '',
              )
            }
            onBlur={initField.commit}
            onKeyDown={(e) =>
              handleKeyDown(e, initField.commit, initField.cancel)
            }
            disabled={isStatsLocked}
            placeholder='—'
            aria-label={t('initiative')}
          />
        </div>
        <button
          onClick={handleRollInitiative}
          disabled={isStatsLocked}
          className={btn.icon}
          title={t('rollInitiative')}
          aria-label={t('rollInitiative')}>
          <Dices size={18} aria-hidden='true' />
        </button>
      </div>

      <CombatantStatsGrid
        isLocked={isStatsLocked}
        cancelPendingRef={cancelPendingRef}
      />
    </div>
  );
};
