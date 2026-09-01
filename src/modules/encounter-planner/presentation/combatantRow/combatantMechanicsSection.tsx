/**
 * @fileoverview Legendary deed and resist mechanics UI for combatants.
 *
 * @module modules/encounter-planner/presentation/combatantRow/combatantMechanicsSection
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for callbacks and state
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types Combatant mechanics type definitions
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description Manages legendary deed pips and resist counters with use/reset controls. Uses CombatantContext for state.
 */

'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useCombatant } from './utils/context/combatantContext';
import styles from './combatantRow.module.scss';

/**
 * Props for CombatantMechanicsSection component.
 *
 * @interface CombatantMechanicsSectionProps
 */
export interface CombatantMechanicsSectionProps {}

/**
 * Mechanics section for Play Mode combatants. Renders null if combatant has no mechanics.
 * Displays legendary deed tracker pips and resist counter. Resist reset restores to 3.
 *
 * @component
 * @param {CombatantMechanicsSectionProps} props - Component props
 * @returns {JSX.Element | null} Rendered mechanics section or null if no mechanics
 *
 * @example
 * // Within CombatantProvider
 * <CombatantMechanicsSection />
 */
export const CombatantMechanicsSection: React.FC<CombatantMechanicsSectionProps> = () => {
  const { combatant, updateField, onUpdate } = useCombatant();
  const { mechanics, legendaryDeedsUsed, resistRemaining } = combatant;

  const t = useTranslations('encounterPlanner');

  const handleToggleDeed = useCallback(
    (index: number) => {
      const newDeeds = [...legendaryDeedsUsed];
      newDeeds[index] = !newDeeds[index];
      updateField('legendaryDeedsUsed', newDeeds);
    },
    [legendaryDeedsUsed, updateField]
  );

  const handleResetDeeds = useCallback(() => {
    updateField(
      'legendaryDeedsUsed',
      legendaryDeedsUsed.map(() => false)
    );
  }, [legendaryDeedsUsed, updateField]);

  const handleUseResist = useCallback(() => {
    if (resistRemaining > 0) {
      const deedsRemaining = legendaryDeedsUsed.filter((used) => !used).length;
      if (deedsRemaining > 0) {
        const newDeeds = [...legendaryDeedsUsed];
        const firstUnusedIndex = newDeeds.findIndex((used) => !used);
        newDeeds[firstUnusedIndex] = true;

        onUpdate({
          ...combatant,
          legendaryDeedsUsed: newDeeds,
          resistRemaining: resistRemaining - 1,
        });
      }
    }
  }, [combatant, legendaryDeedsUsed, resistRemaining, onUpdate]);

  const handleResetResist = useCallback(() => {
    const resetCount = mechanics?.resist ? 3 : 0;
    updateField('resistRemaining', resetCount);
  }, [mechanics?.resist, updateField]);

  const canUseResist = (): boolean => {
    const deedsRemaining = legendaryDeedsUsed.filter((used) => !used).length;
    return resistRemaining > 0 && deedsRemaining > 0;
  };

  if (!mechanics?.legendaryDeed && !mechanics?.resist) {
    return null;
  }

  return (
    <div className={styles.mechanicsSection}>
      {mechanics?.legendaryDeed && legendaryDeedsUsed.length > 0 && (
        <div className={styles.legendaryDeedsTracker}>
          <label className={styles.label}>{t('legendaryDeeds')}</label>
          <div className={styles.deedPips}>
            {legendaryDeedsUsed.map((used, idx) => (
              <button
                key={idx}
                className={`${styles.deedPip} ${used ? styles.deedUsed : ''}`}
                onClick={() => handleToggleDeed(idx)}
                title={t('legendaryDeedToggle')}
                aria-label={used ? '●' : '○'}
              >
                {used ? '●' : '○'}
              </button>
            ))}
          </div>
          <button
            onClick={handleResetDeeds}
            className={styles.resetButton}
            title={t('legendaryDeedsReset')}
          >
            ↺
          </button>
        </div>
      )}

      {mechanics?.resist && (
        <div className={styles.resistTracker}>
          <label className={styles.label}>{t('resist')}</label>
          <div className={styles.resistCounter}>
            <span className={styles.resistCount}>{resistRemaining}</span>
          </div>
          <button
            onClick={handleUseResist}
            className={`${styles.resistButton} ${!canUseResist() ? styles.disabled : ''}`}
            disabled={!canUseResist()}
            aria-label={t('resistUse')}
          >
            {t('resistUse')}
          </button>
          <button
            onClick={handleResetResist}
            className={styles.resetButton}
            title={t('resistReset')}
          >
            ↺
          </button>
        </div>
      )}
    </div>
  );
};
