/**
 * @fileoverview AC combat stat chip — armour class with lockable edit mode.
 *
 * @module character-builder/presentation/stats/acChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

export interface AcChipProps {
  ac: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}

/** AC chip with lockable edit mode. */
const AcChip = ({ ac, isUnlocked, toggle, patch }: AcChipProps) => {
  const tCommon = useTranslations('common');
  const u = isUnlocked('ac');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='ac' />
      <span className={styles.statChipLabel}>{tCommon('ac')}</span>
      {u ? (
        <NumericInput
          value={ac}
          min={0}
          max={99}
          size='sm'
          ariaLabel={tCommon('ac')}
          onChange={(v) => patch({ ac: v ?? 10 })}
        />
      ) : (
        <span className={styles.statChipValue}>{ac}</span>
      )}
    </div>
  );
};

export const AcChipMemo = memo(AcChip);
