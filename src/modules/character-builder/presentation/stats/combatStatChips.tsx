/**
 * @fileoverview Combat Stat Chips — HP, AC, Initiative, Speed, Tier, Grit.
 * Lock state is local (useState) — no full-row re-render on toggle.
 * Each chip is memoised in its own module so only the toggled chip re-renders.
 *
 * @module character-builder/presentation/stats/combatStatChips
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { computeAbilityModifier } from '@/modules/character-builder/lib/utils/characterStorage';
import { recalculateHpMax } from '@/modules/character-builder/lib/utils/hitDiceUtils';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';
import { AcChipMemo } from './acChip';
import { GritChipMemo } from './gritChip';
import { HpChipMemo } from './hpChip';
import { InitChipMemo } from './initChip';
import { SpeedChipMemo } from './speedChip';
import { TierChipMemo } from './tierChip';

export interface CombatStatChipsProps {
  data: CharacterSheetType;
  patch: (partial: Partial<CharacterSheetType>) => void;
}

/** Six right-side combat stat chips with per-stat lock toggles. */
export const CombatStatChips: React.FC<CombatStatChipsProps> = ({
  data,
  patch,
}) => {
  const t = useTranslations('characterSheet');
  const [overrides, setOverrides] = useState<string[]>(
    () => data.manualStatOverrides ?? [],
  );
  const isUnlocked = useCallback(
    (k: string) => overrides.includes(k),
    [overrides],
  );
  const toggle = useCallback((k: string) => {
    setOverrides((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }, []);

  const conMod = computeAbilityModifier(data.abilityScores.con);
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
      patch({ hitDiceLog: updatedLog, hpMax: recalculateHpMax(updatedLog) }),
    [patch],
  );
  const spendGrit = useCallback(() => {
    if (data.gritCurrent > 0) patch({ gritCurrent: data.gritCurrent - 1 });
  }, [patch, data.gritCurrent]);
  const restoreGrit = useCallback(() => {
    if (data.gritCurrent < data.gritMax)
      patch({ gritCurrent: data.gritCurrent + 1 });
  }, [patch, data.gritCurrent, data.gritMax]);

  return (
    <div
      className={styles.combatStatsRow}
      role='group'
      aria-label={t('ariaCombatStats')}>
      <HpChipMemo
        data={data}
        conMod={conMod}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
        onHitDiceCommit={handleHitDiceCommit}
      />
      <AcChipMemo
        ac={data.ac}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
      />
      <InitChipMemo
        initBonus={data.initiativeBonus}
        initStr={initStr}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
      />
      <SpeedChipMemo
        speedOverride={data.speedOverride}
        bloodlineSpeeds={data.bloodlineSpeeds}
        speedDisplay={speedDisplay}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
      />
      <TierChipMemo
        tierBonus={data.tierBonus}
        tierStr={tierStr}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
      />
      <GritChipMemo
        gritCurrent={data.gritCurrent}
        gritMax={data.gritMax}
        isUnlocked={isUnlocked}
        toggle={toggle}
        patch={patch}
        spendGrit={spendGrit}
        restoreGrit={restoreGrit}
      />
    </div>
  );
};
