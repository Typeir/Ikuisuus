/**
 * @fileoverview Character Sheet Header
 * @description Sticky header for the character sheet. Renders the character
 * name (editable in edit mode), the level/XP meta, the compact
 * `<VocationSelector>` (selectors only — boon picker is relegated to the
 * Bloodline tab), the BP counter, and the edit/save/cancel button group.
 *
 * @module lib/components/characterSheet/characterSheetHeader
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { TextInput } from '@/lib/components/ui/textInput';
import { Tooltip } from '@/lib/components/ui/tooltip';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import type {
  CharacterShard,
  CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { getCharacterDerived } from '@/modules/character-builder/lib/utils/characterDerivation';
import { computeBpSpent } from '@/modules/character-builder/lib/utils/shardExtractor';
import {
  getXPForLevel,
  getXpAxisPosition,
  MAX_XP_LEVEL,
  XP_THRESHOLDS,
} from '@/modules/character-builder/lib/utils/xpProgression';
import btn from '@/styles/buttons.module.scss';
import { useTranslations } from 'next-intl';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSheetMutators } from '../../application/context/activeSheetContext';
import { VocationSelector } from '../builder/vocationSelector';
import styles from './characterSheetHeader.module.scss';

/**
 * Props for `<CharacterSheetHeader>`.
 * @interface CharacterSheetHeaderProps
 * @property {CharacterSheetType} data - Active character data
 * @property {boolean} editing - Whether edit mode is active
 * @property {() => void} onEdit - Enter edit mode
 * @property {() => void} onSave - Persist draft
 * @property {() => void} onCancel - Discard draft
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 */
export interface CharacterSheetHeaderProps {
  data: CharacterSheetType;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (patch: Partial<CharacterSheetType>) => void;
}

/**
 * Sticky character-sheet header.
 *
 * @component
 * @param {CharacterSheetHeaderProps} props - Component props
 * @param {CharacterSheetType} props.data - Active character data
 * @param {boolean} props.editing - Whether edit mode is active
 * @param {() => void} props.onEdit - Enter edit mode
 * @param {() => void} props.onSave - Persist draft
 * @param {() => void} props.onCancel - Discard draft
 * @param {(patch: Partial<CharacterSheetType>) => void} props.onChange - Patch the draft
 * @returns {JSX.Element} Rendered header
 */
export const CharacterSheetHeader: React.FC<CharacterSheetHeaderProps> = ({
  data,
  editing,
  onEdit,
  onSave,
  onCancel,
  onChange,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const isMobile = useIsMobileViewport();
  const { patchExperience } = useSheetMutators();
  const bpSpent = useMemo(
    () => computeBpSpent(data.selectedBoons as CharacterShard[]),
    [data.selectedBoons],
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
  const [xpInput, setXpInput] = useState<number>(data.experience ?? 0);
  const debouncedXp = useDebounce(xpInput, 300);
  const xpChangedRef = useRef(false);

  useEffect(() => {
    setXpInput(data.experience ?? 0);
  }, [data.experience]);

  useEffect(() => {
    if (!xpChangedRef.current) return;
    xpChangedRef.current = false;
    patchExperience(debouncedXp);
  }, [debouncedXp, patchExperience]);

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
              <label className={styles.metaEditLabel}>
                {t('xpLabel')}
                <NumericInput
                  className={styles.metaEditInput}
                  value={xpInput}
                  min={0}
                  size='sm'
                  ariaLabel={t('ariaExperienceInput')}
                  onChange={(v) => {
                    xpChangedRef.current = true;
                    setXpInput(v ?? 0);
                  }}
                />
              </label>
            )}
          </div>

          <div className={styles.bpCounter} aria-label={t('ariaBoonBudget')}>
            {t('bpFormat', { spent: bpSpent, total: data.boonBudget })}
          </div>

          <div className={styles.headerActions}>
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

        <VocationSelector
          bloodlineSlug={data.bloodlineSlug}
          bloodlineTitle={data.bloodlineTitle || ''}
          vocations={data.vocations}
          selectedBoons={data.selectedBoons}
          boonBudget={data.boonBudget}
          editing={editing}
          showBoonPicker={false}
          onChange={onChange}
        />

        <div className={styles.xpTrackGroup}>
          {hasUnassignedLevels && (
            <div className={styles.warningRow}>
              <span className={styles.warningBadge} role='alert'>
                {t('unassignedVocationsWarning', { count: unassignedLevels })}
              </span>
              <Tooltip
                content={t('clearUnassignedLevelsTooltip')}
                placement='top'
                showClickIcon={false}>
                <button
                  type='button'
                  className={styles.clearLevelsBtn}
                  aria-label={t('ariaClearUnassignedLevels')}
                  onClick={() => patchExperience(getXPForLevel(vocationLevel))}>
                  ✕
                </button>
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
            <span className={styles.commandStripBp}>
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
