/**
 * Combatant Heroic Section Component
 *
 * @fileoverview Displays heroic awakening state, affixes, and force awakening controls.
 * Manages heroic awakening tier selection and unawakening.
 *
 * @module modules/encounter-planner/presentation/combatantRow/combatantHeroicSection
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for callbacks
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/lib/components/ui Tooltip component
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types Combatant type definitions
 * @requires @/modules/encounter-planner/application/factories/combatSnapshot.factory forceHeroicAwakening utility
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description Displays awakening state, force awakening buttons, and bonuses.
 * Uses CombatantContext for state.
 */

'use client';

import { Tooltip } from '@/lib/components/ui';
import type {
    HeroicAwakeningState
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { forceHeroicAwakening } from '@/modules/encounter-planner/application/factories/combatSnapshot.factory';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import styles from './combatantRow.module.scss';
import btn from '@/styles/buttons.module.scss';
import { useCombatant } from './utils/context/combatantContext';

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
    tierBonus: 0,
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
export const CombatantHeroicSection: React.FC<
  CombatantHeroicSectionProps
> = () => {
  const { combatant, onUpdate } = useCombatant();
  const locale = useLocale();
  const { heroicAwakening, crText } = combatant;

  const t = useTranslations('encounterPlanner');

  const handleForceAwakening = useCallback(
    (tier: HeroicTier) => {
      const updated = { ...combatant };
      forceHeroicAwakening(updated, tier, locale);
      onUpdate(updated);
    },
    [combatant, locale, onUpdate],
  );

  const handleUnawaken = useCallback(() => {
    const updated = { ...combatant };
    updated.heroicAwakening = { ...DEFAULT_HEROIC_STATE };
    onUpdate(updated);
  }, [combatant, onUpdate]);

  return (
    <div className={styles.heroicRow}>
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
                  className={styles.heroicAffix}>
                  {affix.text}
                </a>
              ))}
            </div>
          )}
          <div className={styles.heroicBonuses}>
            <span>Prof +{heroicAwakening.bonuses.tierBonus}</span>
            <span>AC +{heroicAwakening.bonuses.acBonus}</span>
            <span>Saves +{heroicAwakening.bonuses.savingThrowBonus}</span>
          </div>
        </div>
      )}

      {crText && (
        <div className={styles.forceAwakeningButtonsSection}>
          <label className={styles.label}>{t('forceAwakening')}</label>
          <div className={styles.awakeningButtonGroupOuter}>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top' showClickIcon={false}>
              <button
                onClick={() => handleForceAwakening('awakened')}
                className={btn.secondary}>
                {t('heroic.awakened')}
              </button>
            </Tooltip>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top' showClickIcon={false}>
              <button
                onClick={() => handleForceAwakening('legendary')}
                className={btn.secondary}>
                {t('heroic.legendary')}
              </button>
            </Tooltip>
            <Tooltip content={t('forceAwakeningTooltip')} placement='top' showClickIcon={false}>
              <button
                onClick={() => handleForceAwakening('mythic')}
                className={btn.secondary}>
                {t('heroic.mythic')}
              </button>
            </Tooltip>
            <Tooltip content='Remove Heroic Awakening' placement='top' showClickIcon={false}>
              <button
                onClick={handleUnawaken}
                className={btn.dangerOutline}
                aria-label={t('removeAwakening')}>
                <X size={14} aria-hidden='true' />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
