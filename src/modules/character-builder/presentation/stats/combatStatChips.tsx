/**
 * @fileoverview Combat Stat Chips — HP, AC, Initiative, Speed, Tier, Grit.
 * Lock state is persisted on the character as `manualStatOverrides`.
 *
 * @module character-builder/presentation/stats/combatStatChips
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import {
  useSheetData,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { deriveHitPoints } from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { AcChipMemo } from './acChip';
import { GritChipMemo } from './gritChip';
import { HpChipMemo } from './hpChip';
import { InitChipMemo } from './initChip';
import { SpeedChipMemo } from './speedChip';
import { TierChipMemo } from './tierChip';

/**
 * Six right-side combat stat chips with per-stat lock toggles. Reads the
 * character and write API from the active-sheet context.
 *
 * @component
 * @returns {JSX.Element} Rendered chip row
 */
export const CombatStatChips: React.FC = () => {
  const t = useTranslations('characterSheet');
  const data = useSheetData();
  const { patch } = useSheetMutators();
  const overrides = data.manualStatOverrides ?? [];

  const isUnlocked = useCallback(
    (k: string) => overrides.includes(k),
    [overrides],
  );
  const toggle = useCallback(
    (k: string) =>
      patch({
        manualStatOverrides: overrides.includes(k)
          ? overrides.filter((x) => x !== k)
          : [...overrides, k],
      }),
    [patch, overrides],
  );

  const initStr =
    data.initiativeBonus >= 0
      ? `+${data.initiativeBonus}`
      : `${data.initiativeBonus}`;
  const tierStr =
    data.tierBonus >= 0 ? `+${data.tierBonus}` : `${data.tierBonus}`;
  const speedDisplay =
    data.speedOverride !== null ? `${data.speedOverride} ft.` : '\u2014';

  const handleHitDiceCommit = useCallback(
    (updatedLog: HitDieRollEntry[]) =>
      patch({
        hitDiceLog: updatedLog,
        hpMax: deriveHitPoints({ ...data, hitDiceLog: updatedLog }).base,
      }),
    [patch, data],
  );
  const spendGrit = useCallback(() => {
    if (data.gritCurrent > 0) patch({ gritCurrent: data.gritCurrent - 1 });
  }, [patch, data.gritCurrent]);
  const restoreGrit = useCallback(() => {
    if (data.gritCurrent < data.gritMax)
      patch({ gritCurrent: data.gritCurrent + 1 });
  }, [patch, data.gritCurrent, data.gritMax]);

  const setAc = useCallback((ac: number) => patch({ ac }), [patch]);
  const setInitiative = useCallback(
    (initiativeBonus: number) => patch({ initiativeBonus }),
    [patch],
  );
  const setSpeed = useCallback(
    (speedOverride: number | null) => patch({ speedOverride }),
    [patch],
  );
  const setTierBonus = useCallback(
    (tierBonus: number) => patch({ tierBonus }),
    [patch],
  );
  const setGritCurrent = useCallback(
    (gritCurrent: number) => patch({ gritCurrent }),
    [patch],
  );
  const setGritMax = useCallback(
    (gritMax: number) =>
      patch({ gritMax, gritCurrent: Math.min(data.gritCurrent, gritMax) }),
    [patch, data.gritCurrent],
  );

  return (
    <div
      className={styles.combatStatsRow}
      role='group'
      aria-label={t('ariaCombatStats')}>
      <HpChipMemo
        isUnlocked={isUnlocked}
        toggle={toggle}
        onHitDiceCommit={handleHitDiceCommit}
      />
      <AcChipMemo
        ac={data.ac}
        isUnlocked={isUnlocked}
        toggle={toggle}
        onChange={setAc}
      />
      <InitChipMemo
        initBonus={data.initiativeBonus}
        initStr={initStr}
        isUnlocked={isUnlocked}
        toggle={toggle}
        onChange={setInitiative}
      />
      <SpeedChipMemo
        speedOverride={data.speedOverride}
        bloodlineSpeeds={data.bloodlineSpeeds}
        speedDisplay={speedDisplay}
        isUnlocked={isUnlocked}
        toggle={toggle}
        onChange={setSpeed}
      />
      <TierChipMemo
        tierBonus={data.tierBonus}
        tierStr={tierStr}
        isUnlocked={isUnlocked}
        toggle={toggle}
        onChange={setTierBonus}
      />
      <GritChipMemo
        gritCurrent={data.gritCurrent}
        gritMax={data.gritMax}
        isUnlocked={isUnlocked}
        toggle={toggle}
        onCurrentChange={setGritCurrent}
        onMaxChange={setGritMax}
        spendGrit={spendGrit}
        restoreGrit={restoreGrit}
      />
    </div>
  );
};
