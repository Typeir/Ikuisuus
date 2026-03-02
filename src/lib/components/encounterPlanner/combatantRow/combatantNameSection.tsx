/**
 * Combatant Name Section Component
 *
 * @fileoverview Displays combatant name, CR badge, awakening badges, and action controls.
 * Includes lock toggle, wiki link, and remove button.
 *
 * @module combatantNameSection
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks for memos
 * @requires next-intl useTranslations for internationalized translations
 * @requires @/lib/components/ui Tooltip component
 * @requires @/lib/components/icon Icon component for lock icons
 * @requires @/lib/types/inProgressCombat Combatant type definitions
 * @requires @/lib/utils/heroicAwakeningStyles Awakening class computation
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description
 * Extracted from CombatantRow for atomic composition. Displays the name section with
 * CR badge, awakening tier badges, and control buttons. Uses CombatantContext for state.
 */

'use client';

import Icon from '@/lib/components/icon/icon';
import { Tooltip } from '@/lib/components/ui';
import { X } from 'lucide-react';
import {
  AwakeningClassResult,
  computeAwakeningClasses,
} from '@/lib/utils/heroicAwakeningStyles';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import styles from './combatantRow.module.scss';
import { useCombatant } from './utils/context/combatantContext';

/**
 * Props for CombatantNameSection component.
 * All props are optional when used within CombatantProvider (values come from context).
 *
 * @interface CombatantNameSectionProps
 * @property {string[]} [locked] - Array of locked field names
 * @property {(fieldName: string) => void} [onToggleLock] - Callback to toggle lock on a specific field
 */
export interface CombatantNameSectionProps {
  locked?: string[];
  onToggleLock?: (fieldName: string) => void;
}

/**
 * Name section for Play Mode combatants.
 * Displays name, lock toggle, badges (CR, awakened tier, stratagem), wiki link, and remove button.
 * Uses CombatantContext for state.
 *
 * @component
 * @param {CombatantNameSectionProps} props - Component props
 * @param {string[]} [props.locked] - Array of locked field names
 * @param {(fieldName: string) => void} [props.onToggleLock] - Callback to toggle field lock state
 * @returns {JSX.Element} Rendered name section
 *
 * @example
 * // Within CombatantProvider
 * <CombatantNameSection />
 *
 * @example
 * // With optional lock toggle for stats
 * <CombatantNameSection locked={['stats']} onToggleLock={handleToggle} />
 */
export const CombatantNameSection: React.FC<CombatantNameSectionProps> = ({
  locked = [],
  onToggleLock,
}) => {
  const { combatant, onRemoveSessionOnly, disableLocking } = useCombatant();
  const { name, heroicAwakening, mechanics, sourceHref, crText } = combatant;

  const t = useTranslations('encounterPlanner');

  const isStatsLocked = (locked ?? []).includes('stats');

  const awakeningResult: AwakeningClassResult = useMemo(
    () => computeAwakeningClasses(heroicAwakening),
    [heroicAwakening],
  );

  const renderAwakeningBadge = (): React.ReactNode => {
    if (!awakeningResult.isAwakened) return null;

    const tierBadgeClass = awakeningResult.tier
      ? styles[`awakenedBadge--${awakeningResult.tier}`]
      : '';

    return (
      <>
        <span className={styles.awakenedBadge} data-testid='awakened-badge'>
          {t('heroic.awakened')}
        </span>
        {awakeningResult.tier && (
          <span
            className={`${styles.awakenedBadge} ${tierBadgeClass}`}
            data-testid={`${awakeningResult.tier}-badge`}>
            {t(`heroic.${awakeningResult.tier}`)}
          </span>
        )}
      </>
    );
  };

  return (
    <div className={styles.nameSection}>
      {onToggleLock && !disableLocking && (
        <Tooltip
          content={isStatsLocked ? t('unlockStats') : t('lockStats')}
          placement='top'>
          <button
            onClick={() => onToggleLock('stats')}
            className={styles.lockToggle}
            aria-label={isStatsLocked ? t('unlockStats') : t('lockStats')}
            data-testid='lock-toggle'>
            <Icon
              type={isStatsLocked ? 'lock' : 'unlock'}
              className={styles.lockIcon}
            />
          </button>
        </Tooltip>
      )}
      <span className={styles.name}>{name}</span>
      <span className={styles.nameBadgesWrapper}>
        {crText && <span className={styles.crBadge}>{crText}</span>}
        {renderAwakeningBadge()}
        {mechanics?.stratagem && (
          <div className={styles.stratagemBadgeWrapper}>
            <Tooltip content={t('stratagemTooltip')} placement='top'>
              <span
                className={styles.stratagemBadge}
                data-testid='stratagem-badge'>
                {t('stratagem')}
              </span>
            </Tooltip>
          </div>
        )}
        {sourceHref && (
          <a
            href={sourceHref}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.sourceLink}>
            Wiki
          </a>
        )}
      </span>
      {onRemoveSessionOnly && (
        <button
          onClick={onRemoveSessionOnly}
          className={`${styles.button} ${styles.buttonDanger}`}
          title={t('removeCombatant')}>
          <X size={14} aria-hidden='true' />
        </button>
      )}
    </div>
  );
};
