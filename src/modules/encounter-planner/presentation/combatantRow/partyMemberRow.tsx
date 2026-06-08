/**
 * @fileoverview Party Member Row Component
 * @description Thin row rendering for imported party members in Play Mode.
 * Displays only name, initiative input, and slain toggle.
 *
 * @module partyMemberRow
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { rollInitiative } from '@/modules/encounter-planner/domain/shared/utils';
import { parseIntSafe } from '../utils/statEditing';
import { Dices } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import styles from './combatantRow.module.scss';
import { useCombatant } from './utils/context/combatantContext';
import { useEditableField } from './utils/useEditableField';

/**
 * Thin row for party member combatants.
 * Renders only name, initiative, and slain toggle — no HP, AC, stats, mechanics, or details.
 *
 * @component
 * @returns {JSX.Element} Rendered party member row
 */
export const PartyMemberRow: React.FC = () => {
  const { combatant, updateField, onUpdate } = useCombatant();
  const t = useTranslations('encounterPlanner');
  const cancelPendingRef = useRef(false);

  const { name, initiativeValue, initiativeBonus, slain = false } = combatant;

  const rowClassName = useMemo(() => {
    const classes = [styles.combatantRow, styles.partyMemberRow];
    if (slain) classes.push(styles.slain);
    return classes.join(' ');
  }, [slain]);

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

  const handleToggleSlain = useCallback(() => {
    onUpdate({ ...combatant, slain: !slain });
  }, [combatant, slain, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        initField.commit();
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        initField.cancel();
        e.currentTarget.blur();
      }
    },
    [initField],
  );

  return (
    <div className={rowClassName} data-testid='combatant-row'>
      <div className={styles.mainRow}>
        <span className={styles.partyMemberName}>{name}</span>

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

        <div className={styles.initiativeSection}>
          <div className={styles.initiativeField}>
            <label className={styles.label}>{t('initiative')}</label>
            <input
              type='text'
              className={styles.numberInput}
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
              onKeyDown={handleKeyDown}
              placeholder='—'
              aria-label={t('initiative')}
            />
          </div>
          <button
            onClick={handleRollInitiative}
            className={styles.rollInitiativeButton}
            title={t('rollInitiative')}
            aria-label={t('rollInitiative')}>
            <Dices size={16} aria-hidden='true' />
          </button>
        </div>
      </div>
    </div>
  );
};
