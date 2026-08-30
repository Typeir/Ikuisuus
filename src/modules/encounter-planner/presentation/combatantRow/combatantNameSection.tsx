/**
 * Combatant Name Section Component
 *
 * @fileoverview Renders combatant name, CR badge, awakening badges, and action controls.
 * Handles lock toggle, wiki link, and remove button.
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
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types Combatant type definitions
 * @requires @/lib/utils/heroicAwakeningStyles Awakening class computation
 * @requires ../playMode/CombatantContext useCombatant hook for context
 *
 * @description
 * Renders the combatant name section with CR badge, awakening tier badges, and control buttons.
 * Reads state from CombatantContext.
 */

'use client';

import Icon from '@/lib/components/icon/icon';
import { Tooltip } from '@/lib/components/ui';
import {
    AwakeningClassResult,
    computeAwakeningClasses,
} from '../utils/heroicAwakeningStyles';
import { IconButton } from '@/lib/components/ui/iconButton';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import styles from './combatantRow.module.scss';
import btn from '@/styles/buttons.module.scss';
import { useCombatant } from './utils/context/combatantContext';
import { useEditableField } from './utils/useEditableField';

/**
 * Props for CombatantNameSection.
 * Optional when used within CombatantProvider (values come from context).
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
 * Reads state from CombatantContext.
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
  const { combatant, onRemoveSessionOnly, disableLocking, updateField } =
    useCombatant();
  const { name, heroicAwakening, mechanics, sourceHref, crText } = combatant;

  const t = useTranslations('encounterPlanner');
  const tCommon = useTranslations('common');

  const isStatsLocked = (locked ?? []).includes('stats');

  const cancelPendingRef = useRef(false);

  const nameField = useEditableField(
    cancelPendingRef,
    useCallback(
      (value: string) => {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          updateField('name', trimmed);
        }
      },
      [updateField],
    ),
  );

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameField.commit();
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        nameField.cancel();
        e.currentTarget.blur();
      }
    },
    [nameField],
  );

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
          placement='top'
          showClickIcon={false}>
          <button
            onClick={() => onToggleLock('stats')}
            className={`${btn.icon} ${styles.lockToggle}`}
            aria-label={isStatsLocked ? t('unlockStats') : t('lockStats')}
            data-testid='lock-toggle'>
            <Icon
              type={isStatsLocked ? 'lock' : 'unlock'}
              className={styles.lockIcon}
            />
          </button>
        </Tooltip>
      )}
      <input
        type='text'
        className={styles.name}
        value={nameField.editing !== null ? nameField.editing : name}
        onChange={(e) => nameField.onChange(e.target.value)}
        onFocus={() => nameField.setEditing(name)}
        onBlur={nameField.commit}
        onKeyDown={handleNameKeyDown}
        aria-label={tCommon('name')}
      />
      <span className={styles.nameBadgesWrapper}>
        {crText && <span className={styles.crBadge}>{crText}</span>}
        {renderAwakeningBadge()}
        {mechanics?.stratagem && (
          <div className={styles.stratagemBadgeWrapper}>
            <Tooltip content={t('stratagemTooltip')} placement='top' showClickIcon={false}>
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
        <IconButton
          kind='close'
          label={t('removeCombatant')}
          title={t('removeCombatant')}
          onClick={onRemoveSessionOnly}
        />
      )}
    </div>
  );
};
