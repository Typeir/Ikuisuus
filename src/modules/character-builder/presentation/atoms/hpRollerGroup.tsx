/**
 * @fileoverview HP Roller Group Sub-component
 * @description Renders one vocation's hit dice: a bulk-action row (roll / average
 * / max / set / add / clear all, with an inline value box for "set all"), then
 * one row per level. Each level row has a roll and an average icon button
 * (no-icon tooltips), a value box for a typed value, and an add/remove control —
 * every operation works per-die and in bulk.
 *
 * @module lib/components/characterSheet/atoms/hpRollerGroup
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { Tooltip } from '@/lib/components/ui/tooltip';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { Dices, Sigma } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './hpRollerPanel.module.scss';

/**
 * Props for {@link HpRollerGroup}.
 *
 * @interface HpRollerGroupProps
 * @property {string} vocSlug - Vocation slug
 * @property {string} vocTitle - Vocation display name
 * @property {string} dieType - Prefix-less die faces
 * @property {HitDieRollEntry[]} entries - Level entries for this vocation
 * @property {number} conMod - Live CON modifier, added to each die's contribution
 * @property {(entryId: string) => void} onRoll - Roll one die
 * @property {(entryId: string) => void} onAverage - Average one die
 * @property {(entryId: string, value: number | undefined) => void} onSet - Set one die to a typed value
 * @property {(entryId: string) => void} onAdd - Add one die to HP
 * @property {(entryId: string) => void} onRemove - Remove one die from HP
 * @property {(vocSlug: string) => void} onRollAll - Roll every die
 * @property {(vocSlug: string) => void} onAverageAll - Average every die
 * @property {(vocSlug: string) => void} onMaxAll - Maximise every die
 * @property {(vocSlug: string, value: number) => void} onSetAll - Set every die to a value
 * @property {(vocSlug: string) => void} onAddAll - Add every valued die to HP
 * @property {(vocSlug: string) => void} onClearAll - Remove every die from HP
 */
export interface HpRollerGroupProps {
  vocSlug: string;
  vocTitle: string;
  dieType: string;
  entries: HitDieRollEntry[];
  conMod: number;
  onRoll: (entryId: string) => void;
  onAverage: (entryId: string) => void;
  onSet: (entryId: string, value: number | undefined) => void;
  onAdd: (entryId: string) => void;
  onRemove: (entryId: string) => void;
  onRollAll: (vocSlug: string) => void;
  onAverageAll: (vocSlug: string) => void;
  onMaxAll: (vocSlug: string) => void;
  onSetAll: (vocSlug: string, value: number) => void;
  onAddAll: (vocSlug: string) => void;
  onClearAll: (vocSlug: string) => void;
}

/**
 * One vocation's roller group.
 *
 * @component
 * @param {HpRollerGroupProps} props - Component props
 * @returns {JSX.Element} The rendered group
 */
export const HpRollerGroup: React.FC<HpRollerGroupProps> = ({
  vocSlug,
  vocTitle,
  dieType,
  entries,
  conMod,
  onRoll,
  onAverage,
  onSet,
  onAdd,
  onRemove,
  onRollAll,
  onAverageAll,
  onMaxAll,
  onSetAll,
  onAddAll,
  onClearAll,
}) => {
  const t = useTranslations('characterSheet');
  const [setAllOpen, setSetAllOpen] = useState(false);
  const [setAllValue, setSetAllValue] = useState<number | undefined>(undefined);

  const applySetAll = () => {
    if (setAllValue !== undefined) onSetAll(vocSlug, setAllValue);
    setSetAllOpen(false);
    setSetAllValue(undefined);
  };

  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <span className={styles.groupName}>{vocTitle || vocSlug}</span>
        <span className={styles.groupDie}>d{dieType}</span>
      </div>

      <div className={styles.groupActions}>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onRollAll(vocSlug)}>
          {t('hpRollerRollAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onAverageAll(vocSlug)}>
          {t('hpRollerAvgAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onMaxAll(vocSlug)}>
          {t('hpRollerMaxAll')}
        </button>
        <button
          type='button'
          className={`${styles.groupActionBtn}${setAllOpen ? ` ${styles.active}` : ''}`}
          onClick={() => setSetAllOpen((o) => !o)}>
          {t('hpRollerSetAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onAddAll(vocSlug)}>
          {t('hpRollerAddAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onClearAll(vocSlug)}>
          {t('hpRollerClearAll')}
        </button>
      </div>

      {setAllOpen && (
        <div className={styles.setAllRow}>
          <NumericInput
            value={setAllValue}
            onChange={setSetAllValue}
            min={1}
            max={999}
            size='sm'
            selectOnFocus
            placeholder={t('hpRollerSetAllPlaceholder')}
            ariaLabel={t('hpRollerSetAllAria')}
          />
          <button
            type='button'
            className={styles.confirmBtn}
            onClick={applySetAll}
            disabled={setAllValue === undefined}>
            {t('hpRollerApply')}
          </button>
        </div>
      )}

      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`${styles.entryRow}${entry.addedToHp ? ` ${styles.committed}` : ''}`}>
          <span className={styles.entryLabel}>
            {t('levelAbbrev')} {entry.levelIndex}
          </span>
          <Tooltip
            content={t('hpRollerRollTooltip')}
            placement='top'
            showClickIcon={false}>
            <button
              type='button'
              className={styles.iconBtn}
              onClick={() => onRoll(entry.id)}
              aria-label={t('hpRollerRollDieAria', { level: entry.levelIndex })}>
              <Dices size={14} aria-hidden='true' />
            </button>
          </Tooltip>
          <Tooltip
            content={t('hpRollerAvgTooltip')}
            placement='top'
            showClickIcon={false}>
            <button
              type='button'
              className={styles.iconBtn}
              onClick={() => onAverage(entry.id)}
              aria-label={t('hpRollerAvgDieAria', { level: entry.levelIndex })}>
              <Sigma size={14} aria-hidden='true' />
            </button>
          </Tooltip>
          <NumericInput
            value={entry.result ?? undefined}
            onChange={(v) => onSet(entry.id, v)}
            min={1}
            max={999}
            size='sm'
            selectOnFocus
            placeholder={t('hpRollerManualPlaceholder')}
            ariaLabel={t('hpRollerLevelHpAria', { level: entry.levelIndex })}
          />
          {entry.addedToHp ? (
            <>
              <span className={styles.entryDone}>
                + {conMod} = {(entry.result ?? 0) + conMod}
              </span>
              <button
                type='button'
                className={styles.removeBtn}
                onClick={() => onRemove(entry.id)}
                title={t('hpRollerRemoveTitle')}
                aria-label={t('hpRollerRemoveAria')}>
                ✕
              </button>
            </>
          ) : (
            <button
              type='button'
              className={styles.confirmBtn}
              onClick={() => onAdd(entry.id)}
              disabled={entry.result == null}>
              {t('hpRollerConfirmBtn')}
            </button>
          )}
        </div>
      ))}
    </section>
  );
};
