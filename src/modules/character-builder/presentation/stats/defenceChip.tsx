/**
 * @fileoverview Defence combat stat chip — Deflect and Dodge with lockable edit mode.
 *
 * @module modules/character-builder/presentation/stats/defenceChip
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-16
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import { computeDefence } from '@/modules/character-builder/lib/utils/characterStorage';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

/**
 * Props for the Defence chip.
 *
 * @property {number} deflect - Deflect, the armour part
 * @property {number} dodge - Dodge, the agility part
 * @property {(k: string) => boolean} isUnlocked - Whether a stat key is open for editing
 * @property {(k: string) => void} toggle - Toggles a stat key's lock
 * @property {(deflect: number) => void} onDeflect - Writes a new Deflect
 * @property {(dodge: number) => void} onDodge - Writes a new Dodge
 */
export interface DefenceChipProps {
  deflect: number;
  dodge: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  onDeflect: (deflect: number) => void;
  onDodge: (dodge: number) => void;
}

/** Defence chip: the total always, the two parts as inputs when unlocked. */
const DefenceChip = ({
  deflect,
  dodge,
  isUnlocked,
  toggle,
  onDeflect,
  onDodge,
}: DefenceChipProps) => {
  const tCommon = useTranslations('common');
  const u = isUnlocked('defence');
  return (
    <div className={styles.statChip} data-defence-chip>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='defence' />
      <span className={styles.statChipLabel}>{tCommon('defence')}</span>
      <span className={styles.statChipValue} data-defence-total>
        {computeDefence({ deflect, dodge })}
      </span>
      {u ? (
        <>
          <NumericInput
            value={deflect}
            min={-10}
            max={99}
            size='sm'
            ariaLabel={tCommon('deflect')}
            onChange={(v) => onDeflect(v ?? 0)}
          />
          <NumericInput
            value={dodge}
            min={-10}
            max={99}
            size='sm'
            ariaLabel={tCommon('dodge')}
            onChange={(v) => onDodge(v ?? 0)}
          />
        </>
      ) : (
        <span data-defence-parts>
          {tCommon('deflect')} {deflect} · {tCommon('dodge')} {dodge}
        </span>
      )}
    </div>
  );
};

export const DefenceChipMemo = memo(DefenceChip);
