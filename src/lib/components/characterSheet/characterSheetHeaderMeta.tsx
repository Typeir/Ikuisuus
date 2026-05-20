/**
 * @fileoverview Character Sheet Header — Meta Row
 * @description Renders the row beneath the character name: level field /
 * label, XP field / value, bloodline pill, and per-vocation pills. Extracted
 * from {@link CharacterSheetHeader} so the main file stays within the project
 * file-length budget.
 *
 * @module lib/components/characterSheet/characterSheetHeaderMeta
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import type { CharacterSheet } from '@/lib/types/character';
import { Chip } from '@/lib/components/ui/chip/chip';
import { NumericInput } from '@/lib/components/ui/numericInput';
import { PagePreviewTooltip } from './pagePreviewTooltip';
import { useTranslations } from 'next-intl';
import styles from './characterSheet.module.scss';

/**
 * Props for {@link CharacterSheetHeaderMeta}.
 *
 * @interface CharacterSheetHeaderMetaProps
 * @property {CharacterSheet} data - The character sheet being rendered
 * @property {boolean} editing - True when the header is in edit mode
 * @property {string} locale - Active locale used by page-preview tooltips
 * @property {number} experience - Effective (clamped) XP for display
 * @property {number} xpInput - Local XP input value (only used in edit mode)
 * @property {boolean} hasActiveVocations - True when at least one vocation has a slug
 * @property {boolean} levelMismatch - True when sum(vocation levels) ≠ data.level
 * @property {number} vocationLevelSum - Sum of all active vocation levels
 * @property {number} globalLevel - The user-tracked global character level (data.level)
 * @property {(value: number | undefined) => void} onLevelChange - Called when the global level input changes
 * @property {(value: number) => void} onXpChange - Called when the XP input changes
 */
export interface CharacterSheetHeaderMetaProps {
  data: CharacterSheet;
  editing: boolean;
  locale: string;
  experience: number;
  xpInput: number;
  hasActiveVocations: boolean;
  levelMismatch: boolean;
  vocationLevelSum: number;
  globalLevel: number;
  onLevelChange: (value: number | undefined) => void;
  onXpChange: (value: number) => void;
}

/**
 * Renders the level/XP/bloodline/vocation pill strip displayed beneath the
 * character name. Surfaces warning chips for level mismatches.
 *
 * @component
 * @param {CharacterSheetHeaderMetaProps} props - Component props
 * @returns {JSX.Element} Meta row
 */
export const CharacterSheetHeaderMeta: React.FC<
  CharacterSheetHeaderMetaProps
> = ({
  data,
  editing,
  locale,
  experience,
  xpInput,
  hasActiveVocations,
  levelMismatch,
  vocationLevelSum,
  globalLevel,
  onLevelChange,
  onXpChange,
}) => {
  const t = useTranslations('characterSheet');

  const mismatchChip = levelMismatch ? (
    <Chip
      variant='warning'
      label={t('levelMismatchChip', {
        sum: vocationLevelSum,
        level: globalLevel,
      })}
      title={t('levelMismatchTitle', {
        sum: vocationLevelSum,
        level: globalLevel,
      })}
    />
  ) : null;

  return (
    <div className={styles.meta}>
      {editing ? (
        <>
          <label className={styles.metaEditLabel}>
            {t('levelLabel')}
            <NumericInput
              className={styles.metaEditInput}
              value={data.level}
              min={1}
              max={30}
              size='sm'
              ariaLabel={t('ariaLevelInput')}
              onChange={onLevelChange}
            />
            {mismatchChip}
          </label>
          <label className={styles.metaEditLabel}>
            {t('xpLabel')}
            {hasActiveVocations ? (
              <span className={styles.metaDerivedValue}>
                {experience.toLocaleString()}
              </span>
            ) : (
              <NumericInput
                className={styles.metaEditInput}
                value={xpInput}
                min={0}
                size='sm'
                ariaLabel={t('ariaExperienceInput')}
                onChange={(v) => onXpChange(v ?? 0)}
              />
            )}
          </label>
        </>
      ) : (
        <>
          <span>{t('levelFull', { level: globalLevel })}</span>
          {mismatchChip}
        </>
      )}
      {data.bloodlineTitle && data.bloodlineSlug && (
        <span className={styles.metaPill}>
          {data.bloodlineTitle}
          <PagePreviewTooltip
            kind='bloodlines'
            slug={data.bloodlineSlug}
            title={data.bloodlineTitle}
            locale={locale}
          />
        </span>
      )}
      {data.vocations.map((v) =>
        v.slug ? (
          <span key={v.slug} className={styles.metaPill}>
            {v.title}
            {v.specializationTitle ? ` / ${v.specializationTitle}` : ''}
            {` Lv.${v.level}`}
            {v.level > globalLevel && (
              <Chip
                variant='warning'
                label={t('vocationExceedsGlobalChip', {
                  vocation: v.level,
                  level: globalLevel,
                })}
                title={t('vocationExceedsGlobalTitle', {
                  vocation: v.level,
                  level: globalLevel,
                })}
              />
            )}
            <PagePreviewTooltip
              kind='vocations'
              slug={v.slug}
              title={v.title}
              locale={locale}
            />
          </span>
        ) : null,
      )}
    </div>
  );
};
