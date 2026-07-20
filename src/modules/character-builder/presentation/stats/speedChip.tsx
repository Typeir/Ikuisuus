/**
 * @fileoverview Speed combat stat chip — movement speed with bloodline speed
 * panel and lockable edit mode.
 *
 * @module character-builder/presentation/stats/speedChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { SpeedPanel } from '@/modules/character-builder/presentation/atoms/speedPanel';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

export interface SpeedChipProps {
  speedOverride: number | null;
  bloodlineSpeeds: string[];
  speedDisplay: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}

/** Speed chip with bloodline speed panel and lockable edit mode. */
const SpeedChip = ({
  speedOverride,
  bloodlineSpeeds,
  speedDisplay,
  isUnlocked,
  toggle,
  patch,
}: SpeedChipProps) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('speed');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='speed' />
      <div className={styles.statChipLabelRow}>
        <span className={styles.statChipLabel}>{t('speed')}</span>
        <SpeedPanel bloodlineSpeeds={bloodlineSpeeds ?? []} />
      </div>
      {u ? (
        <NumericInput
          value={speedOverride ?? 30}
          min={0}
          max={999}
          size='sm'
          ariaLabel={t('speed')}
          onChange={(v) => patch({ speedOverride: v })}
        />
      ) : (
        <span className={styles.statChipValue}>{speedDisplay}</span>
      )}
    </div>
  );
};

export const SpeedChipMemo = memo(SpeedChip);
