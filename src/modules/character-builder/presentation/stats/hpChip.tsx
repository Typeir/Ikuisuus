/**
 * @fileoverview HP combat stat chip — current/max HP with temp HP display,
 * Hit Dice counter, and HP roller panel.
 *
 * @module character-builder/presentation/stats/hpChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { HitDiceCounter } from '@/modules/character-builder/presentation/atoms/hitDiceCounter';
import { HpRollerPanel } from '@/modules/character-builder/presentation/atoms/hpRollerPanel';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

export interface HpChipProps {
  data: CharacterSheetType;
  conMod: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
  onHitDiceCommit: (log: HitDieRollEntry[], delta: number) => void;
}

/** HP chip with Hit Dice counter, roller panel, and lockable edit mode. */
const HpChip = ({
  data,
  conMod,
  isUnlocked,
  toggle,
  patch,
  onHitDiceCommit,
}: HpChipProps) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('hp');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='hp' />
      <HitDiceCounter vocations={data.vocations} />
      <div className={styles.statChipLabelRow}>
        <span className={styles.statChipLabel}>{t('hp')}</span>
        <HpRollerPanel
          hitDiceLog={data.hitDiceLog ?? []}
          conMod={conMod}
          onCommit={onHitDiceCommit}
        />
      </div>
      {u ? (
        <div className={styles.statChipBtnRow}>
          <NumericInput
            value={data.hpCurrent}
            min={0}
            max={data.hpMax}
            size='sm'
            ariaLabel={t('hpCurrent')}
            onChange={(v) => patch({ hpCurrent: v ?? 0 })}
          />
          <span className={styles.statChipLabel}>/</span>
          <NumericInput
            value={data.hpMax}
            min={1}
            max={999}
            size='sm'
            ariaLabel={t('hpMax')}
            onChange={(v) => patch({ hpMax: v ?? 1 })}
          />
        </div>
      ) : (
        <span
          className={styles.statChipValue}
          aria-label={t('ariaHp', {
            current: data.hpCurrent,
            max: data.hpMax,
            temp: data.tempHp,
          })}>
          {data.hpCurrent}/{data.hpMax}
          {data.tempHp > 0 && (
            <span className={styles.tempHp}> +{data.tempHp}</span>
          )}
        </span>
      )}
    </div>
  );
};

export const HpChipMemo = memo(HpChip);
