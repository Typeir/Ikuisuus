/**
 * @fileoverview Hit Dice Counter Component
 * @description Compact counter displayed above the HP chip in the combat stats
 * row. Shows the character's total hit dice — expressed as `Nd{type}` for
 * single-vocation characters and as `Nd?` with a breakdown tooltip for mixed
 * (multiclassing) characters.
 *
 * Die type resolution per vocation entry: the entry's own `hitDie` (copied
 * from vocation metadata on selection) wins; when absent (older saves made
 * before `hitDie` existed) the die type is recovered from the character's
 * `hitDiceLog`, which stores the rolled die per level.
 *
 * @module lib/components/characterSheet/atoms/hitDiceCounter
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip/tooltip';
import type { VocationEntry } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
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
 * Returns the die face count from a raw hit die string.
 * Accepts formats like `"d10"`, `"10"`, or `"D10"`.
 *
 * @function parseDieFaces
 * @param {string} raw - Raw hit die value
 * @returns {string} Normalised die size string (e.g. `"10"`) or `"?"` if not parseable
 */
function parseDieFaces(raw: string): string {
  const match = raw.replace(/^d/i, '');
  const n = parseInt(match, 10);
  return Number.isFinite(n) && n > 0 ? String(n) : '?';
}

/**
 * Resolves the die faces for a vocation entry: the entry's own `hitDie`
 * first, then the die type recorded in the hit dice log for that vocation.
 *
 * @function resolveDieFaces
 * @param {VocationEntry} entry - Vocation entry
 * @param {HitDieRollEntry[]} log - Hit die roll history
 * @returns {string} Die size string (e.g. `"10"`) or `"?"` when unknown
 */
function resolveDieFaces(entry: VocationEntry, log: HitDieRollEntry[]): string {
  const own = parseDieFaces(entry.hitDie ?? '');
  if (own !== '?') return own;
  const logged = log.find((e) => e.vocSlug === entry.slug);
  return logged ? parseDieFaces(logged.dieType) : '?';
}

/**
 * Compact hit dice counter rendered above the HP cell.
 * Single vocation: shows e.g. `5d10`. Mixed vocations: shows `Nd?` with a
 * tooltip listing each vocation's contribution and a reminder to track them
 * separately.
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
  const isMixed = uniqueDice.size > 1 || dieFaces.some((d) => d === '?');

  const label = isMixed
    ? `${totalLevel}d?`
    : `${totalLevel}d${[...uniqueDice][0]}`;

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
            {v.level}d{resolveDieFaces(v, hitDiceLog)}
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
