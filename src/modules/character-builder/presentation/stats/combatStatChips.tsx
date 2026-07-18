/**
 * @fileoverview Combat Stat Chips — HP, AC, Initiative, Speed, Tier, Grit.
 * Lock state is local (useState) — no full-row re-render on toggle.
 * Each chip is memoised so only the toggled chip re-renders.
 *
 * @module character-builder/presentation/stats/combatStatChips
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { CharacterSheet as CharacterSheetType } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { computeAbilityModifier } from '@/modules/character-builder/lib/utils/characterStorage';
import { HitDiceCounter } from '@/modules/character-builder/presentation/atoms/hitDiceCounter';
import { HpRollerPanel } from '@/modules/character-builder/presentation/atoms/hpRollerPanel';
import { SpeedPanel } from '@/modules/character-builder/presentation/atoms/speedPanel';
import { Lock, LockOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useState } from 'react';
import styles from '../CharacterSheet/characterSheet.module.scss';

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
    (updatedLog: HitDieRollEntry[], hpDelta: number) =>
      patch({ hitDiceLog: updatedLog, hpMax: (data.hpMax ?? 0) + hpDelta }),
    [patch, data.hpMax],
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

/* ---- LockBtn ---- */
const LockBtn = memo(
  ({
    isUnlocked,
    toggle,
    k,
  }: {
    isUnlocked: (k: string) => boolean;
    toggle: (k: string) => void;
    k: string;
  }) => {
    const t = useTranslations('characterSheet');
    const unlocked = isUnlocked(k);
    const Icon = unlocked ? LockOpen : Lock;
    return (
      <button
        type='button'
        className={`${styles.lockToggle} ${unlocked ? styles.lockUnlocked : ''}`}
        aria-label={unlocked ? t('lockUnlock') : t('lockLocked')}
        onClick={() => toggle(k)}>
        <Icon size={11} strokeWidth={2.5} aria-hidden='true' />
      </button>
    );
  },
);
LockBtn.displayName = 'LockBtn';

/* ---- HP ---- */
const HpChip = ({
  data,
  conMod,
  isUnlocked,
  toggle,
  patch,
  onHitDiceCommit,
}: {
  data: CharacterSheetType;
  conMod: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
  onHitDiceCommit: (log: HitDieRollEntry[], delta: number) => void;
}) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('hp');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='hp' />
      <HitDiceCounter vocations={data.vocations} />
      <div className={styles.statChipLabelRow}>
        <span className={styles.statChipLabel}>{t('hp')}</span>
        <HpRollerPanel
          hitDiceLog={data.hitDiceLog ?? []}
          conMod={conMod}
          onCommit={onHitDiceCommit}
        />
      </div>
      {u ? (
        <div className={styles.statChipBtnRow}>
          <NumericInput
            value={data.hpCurrent}
            min={0}
            max={data.hpMax}
            size='sm'
            ariaLabel={t('hpCurrent')}
            onChange={(v) => patch({ hpCurrent: v ?? 0 })}
          />
          <span className={styles.statChipLabel}>/</span>
          <NumericInput
            value={data.hpMax}
            min={1}
            max={999}
            size='sm'
            ariaLabel={t('hpMax')}
            onChange={(v) => patch({ hpMax: v ?? 1 })}
          />
        </div>
      ) : (
        <span
          className={styles.statChipValue}
          aria-label={t('ariaHp', {
            current: data.hpCurrent,
            max: data.hpMax,
            temp: data.tempHp,
          })}>
          {data.hpCurrent}/{data.hpMax}
          {data.tempHp > 0 && (
            <span className={styles.tempHp}> +{data.tempHp}</span>
          )}
        </span>
      )}
    </div>
  );
};
const HpChipMemo = memo(HpChip);

/* ---- AC ---- */
const AcChip = ({
  ac,
  isUnlocked,
  toggle,
  patch,
}: {
  ac: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('ac');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='ac' />
      <span className={styles.statChipLabel}>{t('ac')}</span>
      {u ? (
        <NumericInput
          value={ac}
          min={0}
          max={99}
          size='sm'
          ariaLabel={t('ac')}
          onChange={(v) => patch({ ac: v ?? 10 })}
        />
      ) : (
        <span className={styles.statChipValue}>{ac}</span>
      )}
    </div>
  );
};
const AcChipMemo = memo(AcChip);

/* ---- Initiative ---- */
const InitChip = ({
  initBonus,
  initStr,
  isUnlocked,
  toggle,
  patch,
}: {
  initBonus: number;
  initStr: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('initiative');
  return (
    <div className={styles.statChip}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='initiative' />
      <span className={styles.statChipLabel}>{t('initiative')}</span>
      {u ? (
        <NumericInput
          value={initBonus}
          min={-20}
          max={20}
          size='sm'
          ariaLabel={t('initiative')}
          onChange={(v) => patch({ initiativeBonus: v ?? 0 })}
        />
      ) : (
        <span className={styles.statChipValue}>{initStr}</span>
      )}
    </div>
  );
};
const InitChipMemo = memo(InitChip);

/* ---- Speed ---- */
const SpeedChip = ({
  speedOverride,
  bloodlineSpeeds,
  speedDisplay,
  isUnlocked,
  toggle,
  patch,
}: {
  speedOverride: number | null;
  bloodlineSpeeds: string[];
  speedDisplay: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}) => {
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
const SpeedChipMemo = memo(SpeedChip);

/* ---- Tier ---- */
const TierChip = ({
  tierBonus,
  tierStr,
  isUnlocked,
  toggle,
  patch,
}: {
  tierBonus: number;
  tierStr: string;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
}) => {
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
          onChange={(v) => patch({ tierBonus: v ?? 1 })}
        />
      ) : (
        <span className={styles.statChipValue}>{tierStr}</span>
      )}
    </div>
  );
};
const TierChipMemo = memo(TierChip);

/* ---- Grit ---- */
const GritChip = ({
  gritCurrent,
  gritMax,
  isUnlocked,
  toggle,
  patch,
  spendGrit,
  restoreGrit,
}: {
  gritCurrent: number;
  gritMax: number;
  isUnlocked: (k: string) => boolean;
  toggle: (k: string) => void;
  patch: (p: Partial<CharacterSheetType>) => void;
  spendGrit: () => void;
  restoreGrit: () => void;
}) => {
  const t = useTranslations('characterSheet');
  const u = isUnlocked('grit');
  return (
    <div className={styles.statChip} aria-label={t('ariaGrit')}>
      <LockBtn isUnlocked={isUnlocked} toggle={toggle} k='grit' />
      <span className={styles.statChipLabel}>{t('grit')}</span>
      {u ? (
        <div className={styles.statChipBtnRow}>
          <NumericInput
            value={gritCurrent}
            min={0}
            max={gritMax}
            size='sm'
            ariaLabel={t('gritCurrent')}
            onChange={(v) => patch({ gritCurrent: Math.min(v ?? 0, gritMax) })}
          />
          <span className={styles.statChipLabel}>/</span>
          <NumericInput
            value={gritMax}
            min={0}
            max={99}
            size='sm'
            ariaLabel={t('gritMax')}
            onChange={(v) =>
              patch({
                gritMax: v ?? 0,
                gritCurrent: Math.min(gritCurrent, v ?? 0),
              })
            }
          />
        </div>
      ) : (
        <span className={styles.statChipValue}>
          {gritCurrent}/{gritMax}
        </span>
      )}
      <div className={styles.statChipBtnRow}>
        <button
          type='button'
          className={styles.statChipBtn}
          aria-label={t('gritSpend')}
          onClick={spendGrit}
          disabled={gritCurrent <= 0}>
          {'\u2212'}
        </button>
        <button
          type='button'
          className={styles.statChipBtn}
          aria-label={t('gritRestore')}
          onClick={restoreGrit}
          disabled={gritCurrent >= gritMax}>
          +
        </button>
      </div>
    </div>
  );
};
const GritChipMemo = memo(GritChip);
