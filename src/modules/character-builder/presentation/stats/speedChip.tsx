/**
 * @fileoverview Speed combat stat chip — movement speed with bloodline speed
 * panel and lockable edit mode.
 *
 * @module modules/character-builder/presentation/stats/speedChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
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
  onChange: (speedOverride: number | null) => void;
}

/** Speed chip with bloodline speed panel and lockable edit mode. */
const SpeedChip = ({
  speedOverride,
  bloodlineSpeeds,
  speedDisplay,
  isUnlocked,
  toggle,
  onChange,
}: SpeedChipProps) => {
  const tCommon = useTranslations('common');
  const u = isUnlocked('speed');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='speed' />
      <div className={styles.statChipLabelRow}>
        <span className={styles.statChipLabel}>{tCommon('speed')}</span>
        <SpeedPanel bloodlineSpeeds={bloodlineSpeeds ?? []} />
      </div>
      {u ? (
        <NumericInput
          value={speedOverride ?? 30}
          min={0}
          max={999}
          size='sm'
          ariaLabel={tCommon('speed')}
          onChange={(v) => onChange(v ?? null)}
        />
      ) : (
        <span className={styles.statChipValue}>{speedDisplay}</span>
      )}
    </div>
  );
};

export const SpeedChipMemo = memo(SpeedChip);
