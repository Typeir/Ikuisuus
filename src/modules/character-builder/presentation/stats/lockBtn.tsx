/**
 * @fileoverview Lock toggle button shared by all combat stat chips.
 * Memoised component.
 *
 * @module character-builder/presentation/stats/lockBtn
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { IconButton } from '@/lib/components/ui/iconButton';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';

export interface LockBtnProps {
  /** Predicate: is this stat key currently unlocked? */
  isUnlocked: (k: string) => boolean;
  /** Toggle callback for the given stat key. */
  toggle: (k: string) => void;
  /** Stat identifier (e.g. 'hp', 'ac', 'initiative'). */
  k: string;
}

/** Shared lock/unlock toggle button for combat stat chips. */
export const LockBtn = memo(
  ({ isUnlocked, toggle, k }: LockBtnProps) => {
    const t = useTranslations('characterSheet');
    const unlocked = isUnlocked(k);
    return (
      <IconButton
        kind={unlocked ? 'unlock' : 'lock'}
        size='xs'
        label={unlocked ? t('lockUnlock') : t('lockLocked')}
        onClick={() => toggle(k)}
        className={styles.lockToggle}
      />
    );
  },
);
LockBtn.displayName = 'LockBtn';
