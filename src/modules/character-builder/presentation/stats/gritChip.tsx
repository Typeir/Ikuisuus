/**
 * @fileoverview Grit combat stat chip — current/max grit with spend/restore
 * buttons and lockable edit mode.
 *
 * @module character-builder/presentation/stats/gritChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

export interface GritChipProps {
  gritCurrent: number;
  gritMax: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  onCurrentChange: (gritCurrent: number) => void;
  onMaxChange: (gritMax: number) => void;
  spendGrit: () => void;
  restoreGrit: () => void;
}

/** Grit chip with spend/restore buttons and lockable edit mode. */
const GritChip = ({
  gritCurrent,
  gritMax,
  isUnlocked,
  toggle,
  onCurrentChange,
  onMaxChange,
  spendGrit,
  restoreGrit,
}: GritChipProps) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const u = isUnlocked('grit');
  return (
    <div className={styles.statChip} aria-label={t('ariaGrit')}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='grit' />
      <span className={styles.statChipLabel}>{t('grit')}</span>
      {u ? (
        <div className={styles.statChipBtnRow}>
          <NumericInput
            value={gritCurrent}
            min={0}
            max={gritMax}
            size='sm'
            ariaLabel={t('gritCurrent')}
            onChange={(v) => onCurrentChange(Math.min(v ?? 0, gritMax))}
          />
          <span className={styles.statChipLabel}>/</span>
          <NumericInput
            value={gritMax}
            min={0}
            max={99}
            size='sm'
            ariaLabel={tCommon('max')}
            onChange={(v) => onMaxChange(v ?? 0)}
          />
        </div>
      ) : (
        <span className={styles.statChipValue}>
          {gritCurrent}/{gritMax}
        </span>
      )}
      <div className={styles.statChipBtnRow}>
        <button
          type='button'
          className={styles.statChipBtn}
          aria-label={t('gritSpend')}
          onClick={spendGrit}
          disabled={gritCurrent <= 0}>
          {'\u2212'}
        </button>
        <button
          type='button'
          className={styles.statChipBtn}
          aria-label={t('gritRestore')}
          onClick={restoreGrit}
          disabled={gritCurrent >= gritMax}>
          +
        </button>
      </div>
    </div>
  );
};

export const GritChipMemo = memo(GritChip);
