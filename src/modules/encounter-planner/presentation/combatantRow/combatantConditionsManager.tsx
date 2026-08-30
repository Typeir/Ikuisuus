/**
 * Combatant Conditions Manager Component
 *
 * @fileoverview Manages conditions on combatants. Renders condition chips and an input to add new conditions.
 *
 * @module combatantConditionsManager
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for state and callbacks
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types ConditionEntry type definition
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description
 * Reads and updates conditions via CombatantContext.
 */

'use client';

import type { ConditionEntry } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import detailStyles from '../creatureRow.module.scss';
import { IconButton } from '@/lib/components/ui/iconButton';
import { useCombatant } from './utils/context/combatantContext';

/**
 * Props for CombatantConditionsManager component.
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
export const CombatantConditionsManager: React.FC<
  CombatantConditionsManagerProps
> = () => {
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
        conditions.filter((c) => c.id !== id),
      );
    },
    [conditions, updateField],
  );

  return (
    <>
      <div className={detailStyles.chips}>
        {conditions.map((condition) => (
          <div key={condition.id} className={detailStyles.chip}>
            {condition.text}
            <IconButton
              kind='close'
              label={t('removeCondition')}
              onClick={() => handleRemoveCondition(condition.id)}
            />
          </div>
        ))}
      </div>
      <div className={detailStyles.addConditionContainer}>
        <input
          type='text'
          className={detailStyles.addConditionInput}
          value={newCondition}
          onChange={(e) => setNewCondition(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCondition()}
          placeholder={t('addCondition')}
        />
        <IconButton
          kind='add'
          size='s'
          label={t('addCondition')}
          onClick={handleAddCondition}
          className={detailStyles.addConditionSlot}
        />
      </div>
    </>
  );
};
