/**
 * @fileoverview Hit Dice Counter Component
 * @description Compact counter above the HP cell in the combat stats row.
 * Shows the character's total hit dice as `Nd{type}` for a single vocation
 * and as `Nd?` with a breakdown tooltip for mixed (multiclassing) characters.
 * Die type per vocation resolves from `hitDie` first, then from `hitDiceLog`;
 * else {@link UNKNOWN_DIE}. Skips vocations with empty slug.
 * @module lib/components/characterSheet/atoms/hitDiceCounter
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip/tooltip';
import type { VocationEntry } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { UNKNOWN_DIE, formatDie } from '@/lib/utils/diceUtils';
import { useTranslations } from 'next-intl';
import styles from './hitDiceCounter.module.scss';

/**
 * Props for the HitDiceCounter component.
 *
 * @interface HitDiceCounterProps
 * @property {VocationEntry[]} vocations - Active vocation entries for the character
 * @property {HitDieRollEntry[]} [hitDiceLog] - Per-level hit die roll history; used to recover die types missing from vocation entries
 */
export interface HitDiceCounterProps {
  vocations: VocationEntry[];
  hitDiceLog?: HitDieRollEntry[];
}

/**
 * Die face count for a vocation entry: `hitDie` first, else the die type in
 * the hit dice log.
 *
 * @function resolveDieFaces
 * @param {VocationEntry} entry - Vocation entry
 * @param {HitDieRollEntry[]} log - Hit die roll history
 * @returns {number} Die face count, or {@link UNKNOWN_DIE} when unknown
 */
function resolveDieFaces(entry: VocationEntry, log: HitDieRollEntry[]): number {
  if (entry.hitDie !== undefined && entry.hitDie > UNKNOWN_DIE) {
    return entry.hitDie;
  }
  const logged = log.find((e) => e.vocSlug === entry.slug);
  return logged?.dieType ?? UNKNOWN_DIE;
}

/**
 * Compact hit dice counter rendered above the HP cell. Single vocation: shows
 * e.g. `5d10`. Mixed vocations: shows `Nd?` with a tooltip listing each
 * vocation's die contribution and a note.
 *
 * @component
 * @param {HitDiceCounterProps} props - Component props
 * @param {VocationEntry[]} props.vocations - Active vocation entries for the character
 * @param {HitDieRollEntry[]} [props.hitDiceLog=[]] - Per-level hit die roll history; used to recover die types missing from vocation entries
 * @returns {JSX.Element} Rendered counter
 */
export const HitDiceCounter: React.FC<HitDiceCounterProps> = ({
  vocations,
  hitDiceLog = [],
}) => {
  const t = useTranslations('characterSheet');
  const active = vocations.filter((v) => Boolean(v.slug));
  const totalLevel = active.reduce((sum, v) => sum + (v.level ?? 1), 0);

  if (active.length === 0) {
    return <span className={styles.counter}>—</span>;
  }

  const dieFaces = active.map((v) => resolveDieFaces(v, hitDiceLog));
  const uniqueDice = new Set(dieFaces);
  const isMixed =
    uniqueDice.size > 1 || dieFaces.some((d) => d === UNKNOWN_DIE);

  const label = isMixed
    ? formatDie(UNKNOWN_DIE, totalLevel)
    : formatDie([...uniqueDice][0], totalLevel);

  if (!isMixed) {
    return (
      <span
        className={styles.counter}
        aria-label={t('ariaHitDice', { dice: label })}>
        {label}
      </span>
    );
  }

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      {active.map((v, i) => (
        <div key={`${i}::${v.slug}`} className={styles.tooltipRow}>
          <span className={styles.tooltipVoc}>{v.title || v.slug}</span>
          <span className={styles.tooltipDice}>
            {formatDie(resolveDieFaces(v, hitDiceLog), v.level)}
          </span>
        </div>
      ))}
      <p className={styles.tooltipNote}>{t('hitDiceMixedNote')}</p>
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      placement='top'
      maxWidth={220}
      showClickIcon={false}>
      <span
        className={`${styles.counter} ${styles.mixed}`}
        aria-label={t('ariaHitDice', { dice: label })}>
        {label}
      </span>
    </Tooltip>
  );
};
