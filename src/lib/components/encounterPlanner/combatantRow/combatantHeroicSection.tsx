/**
 * Combatant Heroic Section Component
 *
 * @fileoverview Displays heroic awakening state, affixes, and force awakening controls.
 * Manages heroic awakening tier selection and unawakening.
 *
 * @module combatantHeroicSection
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for callbacks
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/lib/components/ui Tooltip component
 * @requires @/lib/types/inProgressCombat Combatant type definitions
 * @requires @/lib/utils/inProgressCombatStorage forceHeroicAwakening utility
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description
 * Extracted from CombatantRow for atomic composition. Displays awakening state,
 * force awakening buttons, and bonuses. Uses CombatantContext for state.
 */

'use client';

import type { HeroicAwakeningState, InProgressCombatant } from '@/lib/types/inProgressCombat';
import { forceHeroicAwakening } from '@/lib/utils/inProgressCombatStorage';
import { Tooltip } from '@/lib/components/ui';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useCombatant } from './utils/context/combatantContext';
import styles from './combatantRow.module.scss';

/**
 * Heroic awakening tier options for force awakening controls.
 * @type HeroicTier
 */
type HeroicTier = 'awakened' | 'legendary' | 'mythic';

/**
 * Props for CombatantHeroicSection component.
 * All props are optional when used within CombatantProvider (values come from context).
 *
 * @interface CombatantHeroicSectionProps
 */
export interface CombatantHeroicSectionProps {}

/**
 * Default heroic awakening state for unawakening creatures.
 * @constant
 */
const DEFAULT_HEROIC_STATE: HeroicAwakeningState = {
  fateDieResult: 0,
  heroicDc: 0,
  awakened: false,
  tier: 'none',
  affixes: [],
  bonuses: {
    proficiencyBonus: 0,
    acBonus: 0,
    savingThrowBonus: 0,
  },
  hpOverride: null,
};

/**
 * Heroic awakening section for Play Mode combatants.
 * Displays awakening tier, fate die result, affixes, bonuses, and force awakening buttons.
 * Uses CombatantContext for state and updates.
 *
 * @component
 * @param {CombatantHeroicSectionProps} props - Component props
 * @returns {JSX.Element | null} Rendered heroic section or null if not applicable
 *
 * @example
 * // Within CombatantProvider
 * <CombatantHeroicSection />
 */
export const CombatantHeroicSection: React.FC<CombatantHeroicSectionProps> = () => {
  const { combatant, locale, onUpdate } = useCombatant();
  const { heroicAwakening, crText } = combatant;

  const t = useTranslations('encounterPlanner');

  const handleForceAwakening = useCallback(
    (tier: HeroicTier) => {
      const updated = { ...combatant };
      forceHeroicAwakening(updated, tier, locale);
      onUpdate(updated);
    },
    [combatant, locale, onUpdate]
  );

  const handleUnawaken = useCallback(() => {
    const updated = { ...combatant };
    updated.heroicAwakening = { ...DEFAULT_HEROIC_STATE };
    onUpdate(updated);
  }, [combatant, onUpdate]);

  return (
    <>
      {heroicAwakening.awakened && (
        <div className={styles.heroicInfo}>
          <div className={styles.heroicHeader}>
            <span className={styles.heroicTier}>
              {t(`heroic.${heroicAwakening.tier}`)}
            </span>
            <span className={styles.fateDie}>
              {t('fateDie')}: {heroicAwakening.fateDieResult} ({t('dc')}{' '}
              {heroicAwakening.heroicDc})
            </span>
          </div>
          {heroicAwakening.affixes.length > 0 && (
            <div className={styles.heroicAffixes}>
              {heroicAwakening.affixes.map((affix, idx) => (
                <a
                  key={idx}
                  href={affix.source?.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.heroicAffix}
                >
                  {affix.text}
                </a>
              ))}
            </div>
          )}
          <div className={styles.heroicBonuses}>
            <span>Prof +{heroicAwakening.bonuses.proficiencyBonus}</span>
            <span>AC +{heroicAwakening.bonuses.acBonus}</span>
            <span>Saves +{heroicAwakening.bonuses.savingThrowBonus}</span>
          </div>
        </div>
      )}

      {crText && (
        <div className={styles.forceAwakeningButtonsSection}>
          <label className={styles.label}>{t('forceAwakening')}</label>
          <div className={styles.awakeningButtonGroupOuter}>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top'>
              <button
                onClick={() => handleForceAwakening('awakened')}
                className={styles.awakeningButtonSecondary}
              >
                {t('heroic.awakened')}
              </button>
            </Tooltip>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top'>
              <button
                onClick={() => handleForceAwakening('legendary')}
                className={styles.awakeningButtonSecondary}
              >
                {t('heroic.legendary')}
              </button>
            </Tooltip>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top'>
              <button
                onClick={() => handleForceAwakening('mythic')}
                className={styles.awakeningButtonSecondary}
              >
                {t('heroic.mythic')}
              </button>
            </Tooltip>
            <Tooltip content='Remove Heroic Awakening' placement='top'>
              <button
                onClick={handleUnawaken}
                className={styles.awakeningButtonDanger}
              >
                ✕
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </>
  );
};
