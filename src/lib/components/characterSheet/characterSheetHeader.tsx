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

import type {
    CharacterShard,
    CharacterSheet as CharacterSheetType,
} from '@/lib/types/character';
import { computeBpSpent } from '@/lib/utils/shardExtractor';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';
import styles from './characterSheetHeader.module.scss';
import { PagePreviewTooltip } from './pagePreviewTooltip';
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
  const bpSpent = computeBpSpent(data.selectedBoons as CharacterShard[]);
  const fullName = data.name || t('unnamedCharacter');

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        {editing ? (
          <input
            className={styles.nameInput}
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label={t('ariaCharacterName')}
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
          <span>{t('levelFull', { level: data.level })}</span>
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
          {data.vocationTitle && data.vocationSlug && (
            <span className={styles.metaPill}>
              {data.vocationTitle}
              <PagePreviewTooltip
                kind='vocations'
                slug={data.vocationSlug}
                title={data.vocationTitle}
                locale={locale}
              />
            </span>
          )}
          {data.specializationTitle && data.specializationSlug && (
            <span className={styles.metaPill}>
              {data.specializationTitle}
              <PagePreviewTooltip
                kind='specializations'
                slug={data.specializationSlug}
                title={data.specializationTitle}
                locale={locale}
              />
            </span>
          )}
        </div>

        <div className={styles.bpCounter} aria-label={t('ariaBoonBudget')}>
          {t('bpFormat', { spent: bpSpent, total: data.boonBudget })}
        </div>

        <div className={styles.headerActions}>
          {editing ? (
            <>
              <button
                type='button'
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onSave}>
                {t('save')}
              </button>
              <button type='button' className={styles.btn} onClick={onCancel}>
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              type='button'
              className={styles.btn}
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
        vocationSlug={data.vocationSlug}
        vocationTitle={data.vocationTitle || ''}
        specializationSlug={data.specializationSlug}
        specializationTitle={data.specializationTitle || ''}
        selectedBoons={data.selectedBoons}
        boonBudget={data.boonBudget}
        editing={editing}
        locale={locale}
        showBoonPicker={false}
        onChange={onChange}
      />
    </header>
  );
};
