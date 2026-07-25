/**
 * @fileoverview Unassigned-benefit chip stack
 * @description Floating, non-reflowing row of status pills — one per
 * `(category, tier)` group of benefits the character is owed but has not yet
 * assigned (e.g. "2 unassigned proficiencies", "1 unassigned expertise",
 * "3 unassigned feats"). The pills flex horizontally so they never stack down
 * into the table; once there are enough groups to crowd the row they condense
 * into a single "N unassigned grants" pill whose tooltip lists the breakdown.
 * Reads the unified {@link unassignedByCategory} model and shows only the groups
 * whose category the anchor is responsible for. Purely informational — nothing is
 * ever disabled. Renders nothing when there is nothing to assign.
 *
 * @module modules/character-builder/presentation/atoms/unassignedChips
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import type { CharacterSheet } from '@/lib/types/character';
import { unassignedByCategory } from '@/modules/character-builder/lib/utils/assignableGrants';
import type { UnassignedGroup } from '@/modules/character-builder/lib/utils/assignableGrants';
import type { GrantCategory } from '@/modules/character-builder/lib/utils/grants';
import { useTranslations } from 'next-intl';
import { memo, useMemo } from 'react';
import styles from './unassignedChips.module.scss';

/** Number of distinct groups at which the row condenses into one summary pill. */
const CONDENSE_AT = 3;

/** Maps a `category:tier` group key to its ICU-plural text and aria label keys. */
const LABEL_KEYS: Record<string, { text: string; aria: string }> = {
  'skill:proficient': {
    text: 'unassignedProficiencies',
    aria: 'ariaUnassignedProficiencies',
  },
  'skill:expertise': {
    text: 'unassignedExpertise',
    aria: 'ariaUnassignedExpertise',
  },
  'trade:proficient': {
    text: 'unassignedTrades',
    aria: 'ariaUnassignedTrades',
  },
  'feat:': { text: 'unassignedFeats', aria: 'ariaUnassignedFeats' },
};

/**
 * Builds the label-lookup key for an unassigned group.
 *
 * @function groupKey
 * @param {UnassignedGroup} group - The unassigned group
 * @returns {string} `category:tier` key (tier omitted for feats)
 */
function groupKey(group: UnassignedGroup): string {
  return `${group.category}:${group.tier ?? ''}`;
}

/**
 * Props for `<UnassignedChips>`.
 *
 * @interface UnassignedChipsProps
 * @property {CharacterSheet} character - Character whose unassigned benefits are shown
 * @property {ReadonlyArray<GrantCategory>} categories - Categories this anchor renders (pass a stable reference)
 */
export interface UnassignedChipsProps {
  character: CharacterSheet;
  categories: readonly GrantCategory[];
}

/**
 * Renders the row of unassigned-benefit pills for the given categories, or a
 * single condensed pill with a breakdown tooltip once the row would crowd.
 *
 * @component
 * @param {UnassignedChipsProps} props - Component props
 * @param {CharacterSheet} props.character - Character whose unassigned benefits are shown
 * @param {ReadonlyArray<GrantCategory>} props.categories - Categories this anchor renders
 * @returns {JSX.Element | null} The pill row, or null when nothing is unassigned
 */
const UnassignedChipsImpl: React.FC<UnassignedChipsProps> = ({
  character,
  categories,
}) => {
  const t = useTranslations('characterSheet');
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
