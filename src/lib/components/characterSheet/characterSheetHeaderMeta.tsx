/**
 * @fileoverview Character Sheet Header — Meta Row
 * @description Renders the row beneath the character name: level field /
 * label, XP field / value, bloodline pill, and per-vocation pills. Consumes
 * the active draft, editing flag, and locale from
 * {@link useCharacterSheetEdit} so the header doesn't have to drill props
 * through.
 *
 * @module lib/components/characterSheet/characterSheetHeaderMeta
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip/chip';
import { NumericInput } from '@/lib/components/ui/numericInput';
import { useCharacterSheetEdit } from '@/lib/context/CharacterSheetEditContext';
import { getCharacterDerived } from '@/lib/utils/characterDerivation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { PagePreviewTooltip } from './pagePreviewTooltip';
import styles from './characterSheet.module.scss';

/**
 * Props for {@link CharacterSheetHeaderMeta}.
 *
 * The component reads `data`, `editing`, and `locale` from
 * {@link useCharacterSheetEdit}; only the XP-input value and its handler are
 * passed in (they live on the header because they are coupled to a debounce
 * ref).
 *
 * @interface CharacterSheetHeaderMetaProps
 * @property {number} xpInput - Local XP input value (only used in edit mode)
 * @property {(value: number | undefined) => void} onLevelChange - Called when the global level input changes
 * @property {(value: number) => void} onXpChange - Called when the XP input changes
 */
export interface CharacterSheetHeaderMetaProps {
  xpInput: number;
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
> = ({ xpInput, onLevelChange, onXpChange }) => {
  const t = useTranslations('characterSheet');
  const { data, editing, locale } = useCharacterSheetEdit();

  const derived = useMemo(() => getCharacterDerived(data), [data]);
  const { hasActiveVocations, experience } = derived;
  const vocationLevelSum = useMemo(
    () =>
      data.vocations
        .filter((v) => Boolean(v.slug))
        .reduce((sum, v) => sum + (v.level ?? 0), 0),
    [data.vocations],
  );
  const globalLevel = data.level ?? 1;
  const levelMismatch = hasActiveVocations && vocationLevelSum !== globalLevel;

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
