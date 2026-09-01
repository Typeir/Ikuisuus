/**
 * @fileoverview Initiative combat stat chip with lockable edit mode.
 *
 * @module modules/character-builder/presentation/stats/initChip
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

export interface InitChipProps {
  initBonus: number;
  initStr: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  onChange: (initiativeBonus: number) => void;
}

/** Initiative chip with lockable edit mode. */
const InitChip = ({
  initBonus,
  initStr,
  isUnlocked,
  toggle,
  onChange,
}: InitChipProps) => {
  const tCommon = useTranslations('common');
  const u = isUnlocked('initiative');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='initiative' />
      <span className={styles.statChipLabel}>{tCommon('initiative')}</span>
      {u ? (
        <NumericInput
          value={initBonus}
          min={-20}
          max={20}
          size='sm'
          ariaLabel={tCommon('initiative')}
          onChange={(v) => onChange(v ?? 0)}
        />
      ) : (
        <span className={styles.statChipValue}>{initStr}</span>
      )}
    </div>
  );
};

export const InitChipMemo = memo(InitChip);
