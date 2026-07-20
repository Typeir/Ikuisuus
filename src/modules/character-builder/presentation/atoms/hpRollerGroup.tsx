/**
 * @fileoverview HP Roller Group Sub-component
 * @description Renders a single vocation group with entries and action buttons.
 *
 * @module lib/components/characterSheet/atoms/hpRollerGroup
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { useTranslations } from 'next-intl';
import styles from './hpRollerPanel.module.scss';

export interface HpRollerGroupProps {
  vocSlug: string;
  vocTitle: string;
  dieType: string;
  entries: HitDieRollEntry[];
  conMod: number;
  setAllMode: Set<string>;
  manualValues: Map<string, number>;
  onRoll: (entryId: string) => void;
  onRollAll: (vocSlug: string) => void;
  onAverageAll: (vocSlug: string) => void;
  onSetAll: (vocSlug: string) => void;
  onAddAll: (vocSlug: string) => void;
  onConfirm: (entryId: string) => void;
  onRemove: (entryId: string) => void;
  onManualChange: (entryId: string, value: number | undefined) => void;
  getAverage: (dieType: string) => number;
}

export const HpRollerGroup: React.FC<HpRollerGroupProps> = ({
  vocSlug,
  vocTitle,
  dieType,
  entries,
  conMod,
  setAllMode,
  manualValues,
  onRoll,
  onRollAll,
  onAverageAll,
  onSetAll,
  onAddAll,
  onConfirm,
  onRemove,
  onManualChange,
  getAverage,
}) => {
  const t = useTranslations('characterSheet');
  const inSetMode = setAllMode.has(vocSlug);

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
          onClick={() => onAverageAll(vocSlug)}
          title={t('hpRollerAvgTitle')}>
          {t('hpRollerAvgAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onRollAll(vocSlug)}
          title={t('hpRollerRollTitle')}>
          {t('hpRollerRollAll')}
        </button>
        <button
          type='button'
          className={`${styles.groupActionBtn}${inSetMode ? ` ${styles.active}` : ''}`}
          onClick={() => onSetAll(vocSlug)}
          title={t('hpRollerSetTitle')}>
          {t('hpRollerSetAll')}
        </button>
        <button
          type='button'
          className={styles.groupActionBtn}
          onClick={() => onAddAll(vocSlug)}
          title={t('hpRollerAddTitle')}>
          {t('hpRollerAddAll')}
        </button>
      </div>

      {entries.map((entry) => {
        const avg = getAverage(entry.dieType);
        const manual = manualValues.get(entry.id);
        const display = manual ?? entry.result;

        return (
          <div
            key={entry.id}
            className={`${styles.entryRow}${entry.addedToHp ? ` ${styles.committed}` : ''}`}>
            <span className={styles.entryLabel}>
              {t('levelAbbrev')} {entry.levelIndex}
            </span>

            {entry.addedToHp ? (
              <>
                <span className={styles.entryResult}>{entry.result ?? 0}</span>
                <span className={styles.entryAvg}>{avg}</span>
                <span className={styles.entryDone}>
                  {entry.result ?? 0} + {conMod} ={' '}
                  {(entry.result ?? 0) + conMod}
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
            ) : inSetMode || display !== null ? (
              <>
                <span className={styles.entryResult}>
                  {display ?? `d${entry.dieType}`}
                </span>
                <span className={styles.entryAvg}>{avg}</span>
                <NumericInput
                  value={manual ?? display ?? undefined}
                  onChange={(val) => onManualChange(entry.id, val)}
                  placeholder={
                    display ? String(display) : t('hpRollerEnterPlaceholder')
                  }
                  min={1}
                  max={999}
                  disabled={entry.addedToHp}
                  ariaLabel={t('hpRollerLevelHpAria', {
                    level: entry.levelIndex,
                  })}
                  size='sm'
                />
                {!inSetMode && display !== null && (
                  <button
                    type='button'
                    className={styles.confirmBtn}
                    onClick={() => onConfirm(entry.id)}>
                    {t('hpRollerConfirmBtn')}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type='button'
                  className={styles.rollBtn}
                  onClick={() => onRoll(entry.id)}>
                  {t('hpRollerRollDie', { die: entry.dieType })}
                </button>
                <span className={styles.entryAvg}>{avg}</span>
                <NumericInput
                  value={manual}
                  onChange={(val) => onManualChange(entry.id, val)}
                  placeholder={t('hpRollerManualPlaceholder')}
                  min={1}
                  max={999}
                  disabled={entry.addedToHp}
                  ariaLabel={t('hpRollerLevelManualAria', {
                    level: entry.levelIndex,
                  })}
                  size='sm'
                />
              </>
            )}
          </div>
        );
      })}
    </section>
  );
};
