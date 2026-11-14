/**
 * @fileoverview Character Sheet Header
 * @description Sticky character-sheet header.
 *
 * @module modules/character-builder/presentation/Header/characterSheetHeader
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { TextInput } from '@/lib/components/ui/textInput';
import { Tooltip } from '@/lib/components/ui/tooltip';
import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import type { CharacterShard } from '@/lib/types/character';
import {
  useSheetData,
  useSheetEditing,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { getCharacterDerived } from '@/modules/character-builder/lib/utils/characterDerivation';
import { computeBpStatus } from '@/modules/character-builder/application/builderCore/builderMetrics';
import {
  getXPForLevel,
  getXpAxisPosition,
  MAX_XP_LEVEL,
  XP_THRESHOLDS,
} from '@/modules/character-builder/lib/utils/xpProgression';
import { IconButton } from '@/lib/components/ui/iconButton';
import btn from '@/styles/buttons.module.scss';
import { useTranslations } from 'next-intl';
import { Fragment, useMemo } from 'react';
import { VocationSelector } from '../builder/vocationSelector';
import styles from './characterSheetHeader.module.scss';
import { useDebouncedXp } from './useDebouncedXp';

/**
 * Sticky character-sheet header.
 *
 * @component
 * @returns {JSX.Element} Rendered header
 */
export const CharacterSheetHeader: React.FC = () => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const isMobile = useIsMobileViewport();
  const data = useSheetData();
  const editing = useSheetEditing();
  const {
    patch: onChange,
    patchExperience,
    beginEdit: onEdit,
    saveEdit: onSave,
    cancelEdit: onCancel,
  } = useSheetMutators();
  const { spent: bpSpent, over: bpOver } = useMemo(
    () =>
      computeBpStatus(data.selectedBoons as CharacterShard[], data.boonBudget),
    [data.selectedBoons, data.boonBudget],
  );
  const fullName = data.name || t('unnamedCharacter');
  const derived = useMemo(() => getCharacterDerived(data), [data]);
  const {
    totalLevel,
    experience,
    xpOverallPercent,
    xpProgressPercent,
    xpFloor,
    xpCeiling,
    vocationLevel,
    unassignedLevels,
    hasUnassignedLevels,
  } = derived;
  const { xpInput, onXpInput } = useDebouncedXp(
    data.experience ?? 0,
    patchExperience,
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.topRow}>
          {editing ? (
            <TextInput
              className={styles.nameInput}
              value={data.name}
              onChange={(v) => onChange({ name: v })}
              placeholder={t('namePlaceholder')}
              ariaLabel={t('ariaCharacterName')}
            />
          ) : (
            <h2 className={styles.charName}>
              {fullName.split(' ').map((word, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className={styles.nameFirstLetter}>{word[0]}</span>
                  {word.slice(1)}
                </Fragment>
              ))}
            </h2>
          )}

          <div className={styles.meta}>
            <span>{t('levelFull', { level: totalLevel })}</span>
            {editing && (
              <label
                className={styles.metaEditLabel}
                data-testid='builder-experience'
                data-screenshot-action='set-experience'>
                {t('xpLabel')}
                <NumericInput
                  className={styles.metaEditInput}
                  value={xpInput}
                  min={0}
                  size='sm'
                  ariaLabel={t('ariaExperienceInput')}
                  onChange={onXpInput}
                />
              </label>
            )}
          </div>

          <div
            className={styles.bpCounter}
            data-over={bpOver || undefined}
            data-testid='builder-bp-counter'
            aria-label={t('ariaBoonBudget')}>
            {t('bpFormat', { spent: bpSpent, total: data.boonBudget })}
          </div>

          <div className={styles.headerActions}>
            {editing ? (
              <>
                <button
                  type='button'
                  onClick={onSave}
                  data-testid='builder-save'
                  data-screenshot-action='save-edit'>
                  {tCommon('save')}
                </button>
                <button
                  type='button'
                  className={btn.neutral}
                  onClick={onCancel}
                  data-testid='builder-cancel'
                  data-screenshot-action='cancel-edit'>
                  {tCommon('cancel')}
                </button>
              </>
            ) : (
              <button
                type='button'
                className={btn.neutral}
                onClick={onEdit}
                data-testid='builder-edit'
                data-screenshot-action='begin-edit'
                aria-label={t('ariaEditCharacter')}>
                {tCommon('edit')}
              </button>
            )}
          </div>
        </div>

        <VocationSelector showBoonPicker={false} />

        <div className={styles.xpTrackGroup}>
          {hasUnassignedLevels && (
            <div className={styles.warningRow}>
              <span
                className={styles.warningBadge}
                role='alert'
                data-testid='builder-flag'
                data-flag-code='UNASSIGNED_LEVELS'>
                {t('unassignedVocationsWarning', { count: unassignedLevels })}
              </span>
              <Tooltip
                content={t('clearUnassignedLevelsTooltip')}
                placement='top'
                showClickIcon={false}>
                <IconButton
                  kind='close'
                  shape='rhombus'
                  label={t('ariaClearUnassignedLevels')}
                  onClick={() => patchExperience(getXPForLevel(vocationLevel))}
                />
              </Tooltip>
            </div>
          )}
          <div
            className={styles.xpTrackNext}
            role='progressbar'
            aria-valuenow={experience}
            aria-valuemin={xpFloor}
            aria-valuemax={xpCeiling}
            aria-label={t('xpToNextLevelLabel')}
            title={`${xpProgressPercent}% to next level`}>
            <div
              className={`${styles.xpTrackNextFill}${hasUnassignedLevels ? ` ${styles.xpTrackFillWarning}` : ''}`}
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
          <div
            className={styles.xpTrack}
            role='progressbar'
            aria-valuenow={experience}
            aria-valuemin={0}
            aria-valuemax={XP_THRESHOLDS[MAX_XP_LEVEL]}
            aria-label={t('xpLabel')}
            title={`${experience} XP`}>
            <div
              className={`${styles.xpTrackFill}${hasUnassignedLevels ? ` ${styles.xpTrackFillWarning}` : ''}`}
              style={{ width: `${xpOverallPercent}%` }}
            />
            {Array.from({ length: MAX_XP_LEVEL - 2 }, (_, i) => i + 2).map(
              (level) => (
                <div
                  key={level}
                  className={styles.xpMarker}
                  style={{
                    left: `${getXpAxisPosition(XP_THRESHOLDS[level])}%`,
                  }}
                  aria-hidden='true'
                />
              ),
            )}
          </div>
          <div className={styles.xpCaption} aria-hidden='true'>
            {experience.toLocaleString()} / {xpCeiling.toLocaleString()} XP
          </div>
        </div>
      </header>

      {isMobile === true && (
        <div className={styles.commandStrip}>
          <span className={styles.commandStripMeta}>
            <span
              className={styles.commandStripBp}
              data-over={bpOver || undefined}>
              {t('bpFormat', { spent: bpSpent, total: data.boonBudget })}
            </span>
          </span>
          <div className={styles.commandStripActions}>
            {editing ? (
              <>
                <button type='button' onClick={onSave}>
                  {tCommon('save')}
                </button>
                <button
                  type='button'
                  className={btn.neutral}
                  onClick={onCancel}>
                  {tCommon('cancel')}
                </button>
              </>
            ) : (
              <button
                type='button'
                className={btn.neutral}
                onClick={onEdit}
                aria-label={t('ariaEditCharacter')}>
                {tCommon('edit')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
