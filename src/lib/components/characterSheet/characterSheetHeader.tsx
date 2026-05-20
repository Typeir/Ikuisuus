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

import { TextInput } from '@/lib/components/ui/textInput';
import { CharacterSheetHeaderMeta } from './characterSheetHeaderMeta';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { computeProficiencyBonus } from '@/lib/utils/characterStorage';
import { getCharacterDerived } from '@/lib/utils/characterDerivation';
import { computeBpSpent } from '@/lib/utils/shardExtractor';
import {
    getLevelFromXP,
    getXPForLevel,
    MAX_XP_LEVEL,
    XP_THRESHOLDS,
} from '@/lib/utils/xpProgression';
import { useTranslations } from 'next-intl';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './characterSheetHeader.module.scss';
import { VocationSelector } from './vocationSelector';

/**
 * Props for `<CharacterSheetHeader>`.
 *
 * @interface CharacterSheetHeaderProps
 * @property {CharacterSheetType} data - Active character data (draft or saved)
 * @property {boolean} editing - Whether edit mode is active
 * @property {() => void} onEdit - Enter edit mode
 * @property {() => void} onSave - Persist draft
 * @property {() => void} onCancel - Discard draft
 * @property {(patch: Partial<CharacterSheetType>) => void} onChange - Patch the draft
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface CharacterSheetHeaderProps {
  data: CharacterSheetType;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (patch: Partial<CharacterSheetType>) => void;
  locale?: string;
}

/**
 * Sticky character-sheet header.
 *
 * @component
 * @param {CharacterSheetHeaderProps} props - Component props
 * @returns {JSX.Element} Rendered header
 */
export const CharacterSheetHeader: React.FC<CharacterSheetHeaderProps> = ({
  data,
  editing,
  onEdit,
  onSave,
  onCancel,
  onChange,
  locale = 'en',
}) => {
  const t = useTranslations('characterSheet');
  const bpSpent = useMemo(
    () => computeBpSpent(data.selectedBoons as CharacterShard[]),
    [data.selectedBoons],
  );
  const fullName = data.name || t('unnamedCharacter');
  const derived = useMemo(() => getCharacterDerived(data), [data]);
  const { hasActiveVocations, experience, xpOverallPercent } = derived;
  const vocationLevelSum = useMemo(
    () =>
      data.vocations
        .filter((v) => Boolean(v.slug))
        .reduce((sum, v) => sum + (v.level ?? 0), 0),
    [data.vocations],
  );
  const globalLevel = data.level ?? 1;
  const levelMismatch = hasActiveVocations && vocationLevelSum !== globalLevel;
  const [xpInput, setXpInput] = useState<number>(data.experience ?? 0);
  const debouncedXp = useDebounce(xpInput, 300);
  const xpChangedRef = useRef(false);

  useEffect(() => {
    setXpInput(data.experience ?? 0);
  }, [data.experience]);

  useEffect(() => {
    if (!xpChangedRef.current) return;
    xpChangedRef.current = false;
    const newLevel = Math.min(getLevelFromXP(debouncedXp), MAX_XP_LEVEL);
    onChange({
      experience: debouncedXp,
      level: newLevel,
      proficiencyBonus: computeProficiencyBonus(newLevel),
    });
  }, [debouncedXp, onChange]);

  const handleLevelChange = useCallback(
    (value: number | undefined) => {
      const level = Math.max(1, Math.min(MAX_XP_LEVEL, value ?? 1));
      const experience = getXPForLevel(level);
      onChange({
        level,
        proficiencyBonus: computeProficiencyBonus(level),
        experience,
      });
    },
    [onChange],
  );

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        {editing ? (
          <TextInput
            className={styles.nameInput}
            value={data.name}
            onChange={(v) => onChange({ name: v })}
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

        <CharacterSheetHeaderMeta
          data={data}
          editing={editing}
          locale={locale}
          experience={experience}
          xpInput={xpInput}
          hasActiveVocations={hasActiveVocations}
          levelMismatch={levelMismatch}
          vocationLevelSum={vocationLevelSum}
          globalLevel={globalLevel}
          onLevelChange={handleLevelChange}
          onXpChange={(v) => {
            xpChangedRef.current = true;
            setXpInput(v);
          }}
        />

        <div className={styles.bpCounter} aria-label={t('ariaBoonBudget')}>
          {t('bpFormat', { spent: bpSpent, total: data.boonBudget })}
        </div>

        <div className={styles.headerActions}>
          {editing ? (
            <>
              <button
                type='button'
                className={`${styles.buttonBase} ${styles.buttonPrimary}`}
                onClick={onSave}>
                {t('save')}
              </button>
              <button
                type='button'
                className={styles.buttonBase}
                onClick={onCancel}>
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              type='button'
              className={styles.buttonBase}
              onClick={onEdit}
              aria-label={t('ariaEditCharacter')}>
              {t('edit')}
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
        locale={locale}
        showBoonPicker={false}
        onChange={onChange}
      />

      <div
        className={styles.xpTrack}
        role='progressbar'
        aria-valuenow={experience}
        aria-valuemin={0}
        aria-valuemax={XP_THRESHOLDS[MAX_XP_LEVEL]}
        aria-label={t('xpLabel')}
        title={`${experience} XP`}>
        <div
          className={styles.xpTrackFill}
          style={{ width: `${xpOverallPercent}%` }}
        />
        {Array.from({ length: MAX_XP_LEVEL - 2 }, (_, i) => i + 2).map(
          (level) => (
            <div
              key={level}
              className={styles.xpMarker}
              style={{
                left: `${
                  (XP_THRESHOLDS[level] / XP_THRESHOLDS[MAX_XP_LEVEL]) * 100
                }%`,
              }}
              aria-hidden='true'
            />
          ),
        )}
      </div>
    </header>
  );
};
