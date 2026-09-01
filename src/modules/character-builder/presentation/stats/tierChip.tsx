/**
 * @fileoverview Tier combat stat chip with lockable edit mode.
 *
 * @module modules/character-builder/presentation/stats/tierChip
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

export interface TierChipProps {
  tierBonus: number;
  tierStr: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  onChange: (tierBonus: number) => void;
}

/** Tier chip with lockable edit mode. */
const TierChip = ({
  tierBonus,
  tierStr,
  isUnlocked,
  toggle,
  onChange,
}: TierChipProps) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('tier');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='tier' />
      <span className={styles.statChipLabel}>{t('tierShort')}</span>
      {u ? (
        <NumericInput
          value={tierBonus}
          min={0}
          max={20}
          size='sm'
          ariaLabel={t('tierShort')}
          onChange={(v) => onChange(v ?? 1)}
        />
      ) : (
        <span className={styles.statChipValue}>{tierStr}</span>
      )}
    </div>
  );
};

export const TierChipMemo = memo(TierChip);
