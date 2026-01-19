/**
 * Combatant Conditions Manager Component
 *
 * @fileoverview Manages conditions list for combatants with add/remove functionality.
 * Provides input for new conditions and removal buttons for existing conditions.
 *
 * @module combatantConditionsManager
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for state and callbacks
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/lib/types/inProgressCombat ConditionEntry type definition
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description
 * Extracted from CombatantRow for atomic composition. Displays condition chips
 * with remove buttons and input field for adding new conditions. Uses CombatantContext for state.
 */

'use client';

import type { ConditionEntry } from '@/lib/types/inProgressCombat';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { useCombatant } from './utils/context/combatantContext';
import styles from './combatantRow.module.scss';

/**
 * Props for CombatantConditionsManager component.
 * All props are optional when used within CombatantProvider (values come from context).
 *
 * @interface CombatantConditionsManagerProps
 */
export interface CombatantConditionsManagerProps {}

/**
 * Generates a unique ID for new conditions.
 * @returns {string} Random 9-character ID
 */
function generateConditionId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Conditions manager for Play Mode combatants.
 * Displays condition chips with remove buttons and input field for adding new conditions.
 * Uses CombatantContext for state and updates.
 *
 * @component
 * @param {CombatantConditionsManagerProps} props - Component props
 * @returns {JSX.Element} Rendered conditions manager
 *
 * @example
 * // Within CombatantProvider
 * <CombatantConditionsManager />
 */
export const CombatantConditionsManager: React.FC<CombatantConditionsManagerProps> = () => {
  const { combatant, updateField } = useCombatant();
  const { conditions } = combatant;

  const t = useTranslations('encounterPlanner');
  const [newCondition, setNewCondition] = useState('');

  const handleAddCondition = useCallback(() => {
    if (!newCondition.trim()) return;
    const condition: ConditionEntry = {
      id: generateConditionId(),
      text: newCondition.trim(),
    };
    updateField('conditions', [...conditions, condition]);
    setNewCondition('');
  }, [newCondition, conditions, updateField]);

  const handleRemoveCondition = useCallback(
    (id: string) => {
      updateField(
        'conditions',
        conditions.filter((c) => c.id !== id)
      );
    },
    [conditions, updateField]
  );

  return (
    <div className={styles.conditionsSection}>
      <label className={styles.label}>{t('conditions')}</label>
      <div className={styles.conditionsList}>
        {conditions.map((condition) => (
          <div key={condition.id} className={styles.conditionItem}>
            <span>{condition.text}</span>
            <button
              onClick={() => handleRemoveCondition(condition.id)}
              className={styles.removeCondition}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className={styles.addConditionContainer}>
        <input
          type='text'
          className={styles.addConditionInput}
          value={newCondition}
          onChange={(e) => setNewCondition(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCondition()}
          placeholder={t('addCondition')}
        />
        <button onClick={handleAddCondition} className={styles.addConditionButton}>
          +
        </button>
      </div>
    </div>
  );
};
