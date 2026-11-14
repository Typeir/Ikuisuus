/**
 * @fileoverview Unassigned-benefit chip stack
 * @description Row of status pills, one per `(category, tier)` group of
 * unassigned benefits.
 *
 * @module modules/character-builder/presentation/atoms/unassignedChips
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import {
  UNASSIGNED_LABELS as LABEL_KEYS,
  unassignedGroupKey as groupKey,
} from '@/modules/character-builder/application/builderCore/builderMetrics';
import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { unassignedByCategory } from '@/modules/character-builder/lib/utils/assignableGrants';
import type { GrantCategory } from '@/modules/character-builder/lib/utils/grants';
import { useTranslations } from 'next-intl';
import { memo, useMemo } from 'react';
import styles from './unassignedChips.module.scss';

/** Number of distinct groups at which the row condenses into one summary pill. */
const CONDENSE_AT = 3;

/**
 * Props for `<UnassignedChips>`.
 *
 * @interface UnassignedChipsProps
 * @property {ReadonlyArray<GrantCategory>} categories - Categories this anchor renders
 */
export interface UnassignedChipsProps {
  categories: readonly GrantCategory[];
}

/**
 * Renders a pill row for the given categories, or one condensed pill with a
 * breakdown tooltip at or above {@link CONDENSE_AT} groups.
 *
 * @component
 * @param {UnassignedChipsProps} props - Component props
 * @param {ReadonlyArray<GrantCategory>} props.categories - Categories this anchor renders
 * @returns {JSX.Element | null} The pill row, or null when nothing is unassigned
 */
const UnassignedChipsImpl: React.FC<UnassignedChipsProps> = ({
  categories,
}) => {
  const t = useTranslations('characterSheet');
  const character = useSheetData();
  const groups = useMemo(
    () =>
      unassignedByCategory(character).filter(
        (group) =>
          categories.includes(group.category) && LABEL_KEYS[groupKey(group)],
      ),
    [character, categories],
  );

  if (groups.length === 0) return null;

  if (groups.length >= CONDENSE_AT) {
    const total = groups.reduce((sum, group) => sum + group.count, 0);
    const breakdown = (
      <ul className={styles.breakdown}>
        {groups.map((group) => (
          <li key={groupKey(group)}>
            {t(LABEL_KEYS[groupKey(group)].text, { count: group.count })}
          </li>
        ))}
      </ul>
    );
    return (
      <div className={styles.stack}>
        <Tooltip content={breakdown} placement='left'>
          <span
            className={`${styles.chip} ${styles.summary}`}
            data-testid='builder-flag'
            data-flag-code={groups.map((group) => LABEL_KEYS[groupKey(group)].code).join(' ')}
            role='status'
            tabIndex={0}
            aria-label={t('ariaUnassignedSummary')}>
            {t('unassignedSummary', { count: total })}
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {groups.map((group) => {
        const keys = LABEL_KEYS[groupKey(group)];
        return (
          <span
            key={groupKey(group)}
            className={styles.chip}
            data-testid='builder-flag'
            data-flag-code={keys.code}
            role='status'
            aria-label={t(keys.aria)}>
            {t(keys.text, { count: group.count })}
          </span>
        );
      })}
    </div>
  );
};

/** Memoized `UnassignedChips` export. */
export const UnassignedChips = memo(UnassignedChipsImpl);
