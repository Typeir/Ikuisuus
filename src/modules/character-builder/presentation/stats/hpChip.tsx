/**
 * @fileoverview HP stat chip: current/max HP with temp HP display, Hit Dice
 * counter, and HP roller panel.
 *
 * @module character-builder/presentation/stats/hpChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import {
  useSheetData,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { computeAbilityModifier } from '@/modules/character-builder/lib/utils/characterStorage';
import { HitDiceCounter } from '@/modules/character-builder/presentation/atoms/hitDiceCounter';
import { HpRollerPanel } from '@/modules/character-builder/presentation/atoms/hpRollerPanel';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { LockBtn } from './lockBtn';

export interface HpChipProps {
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  onHitDiceCommit: (log: HitDieRollEntry[]) => void;
}

/**
 * Renders the HP chip with Hit Dice counter and roller panel. Reads character
 * and write API from the active-sheet context. While the `hp` lock is engaged,
 * current HP is read-only and the roller is disabled; unlocked, current HP is
 * editable, clamped to `[-hpMax, hpMax]`. Max HP is a read-only derived value
 * (cache of `deriveHitPoints`); temp HP shows when positive.
 */
const HpChip = ({ isUnlocked, toggle, onHitDiceCommit }: HpChipProps) => {
  const tCommon = useTranslations('common');
  const data = useSheetData();
  const { patch } = useSheetMutators();
  const conMod = computeAbilityModifier(data.abilityScores.con);
  const u = isUnlocked('hp');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='hp' />
      <HitDiceCounter
        vocations={data.vocations}
        hitDiceLog={data.hitDiceLog ?? []}
      />
      <div className={styles.statChipLabelRow}>
        <span className={styles.statChipLabel}>{tCommon('hp')}</span>
        <HpRollerPanel
          hitDiceLog={data.hitDiceLog ?? []}
          conMod={conMod}
          onCommit={onHitDiceCommit}
          disabled={!u}
        />
      </div>
      <div className={styles.statChipBtnRow}>
        {u ? (
          <NumericInput
            value={data.hpCurrent}
            min={-data.hpMax}
            max={data.hpMax}
            size='sm'
            ariaLabel={tCommon('hpCurrent')}
            onChange={(v) => patch({ hpCurrent: v ?? 0 })}
          />
        ) : (
          <span className={styles.statChipValue} aria-label={tCommon('hpCurrent')}>
            {data.hpCurrent}
          </span>
        )}
        <span className={styles.statChipLabel}>/</span>
        <span className={styles.statChipValue} aria-label={tCommon('hpMax')}>
          {data.hpMax}
        </span>
        {data.tempHp > 0 && (
          <span className={styles.tempHp}> +{data.tempHp}</span>
        )}
      </div>
    </div>
  );
};

export const HpChipMemo = memo(HpChip);
