/**
 * @fileoverview Hit Dice Counter Component
 * @description Compact counter displayed above the HP chip in the combat stats
 * row. Shows the character's total hit dice — expressed as `Nd{type}` for
 * single-vocation characters and as `Nd?` with a breakdown tooltip for mixed
 * (multiclassing) characters.
 *
 * @module lib/components/characterSheet/atoms/hitDiceCounter
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import type { VocationEntry } from '@/lib/types/character';
import { Tooltip } from '@/lib/components/ui/tooltip/tooltip';
import styles from './hitDiceCounter.module.scss';

/**
 * Props for the HitDiceCounter component.
 *
 * @interface HitDiceCounterProps
 * @property {VocationEntry[]} vocations - Active vocation entries for the character
 */
export interface HitDiceCounterProps {
  vocations: VocationEntry[];
}

/**
 * Returns the die face count from a `hitDie` string stored on a vocation entry.
 * Accepts formats like `"d10"`, `"10"`, or `"D10"`.
 *
 * @function parseDieFaces
 * @param {string} raw - Raw hit die value from vocation entry
 * @returns {string} Normalised die size string (e.g. `"10"`) or `"?"` if not parseable
 */
function parseDieFaces(raw: string): string {
  const match = raw.replace(/^d/i, '');
  const n = parseInt(match, 10);
  return Number.isFinite(n) && n > 0 ? String(n) : '?';
}

/**
 * Compact hit dice counter rendered above the HP cell.
 * Single vocation: shows e.g. `5d10`. Mixed vocations: shows `Nd?` with a
 * tooltip listing each vocation's contribution and a reminder to track them
 * separately.
 *
 * @component
 * @param {HitDiceCounterProps} props - Component props
 * @returns {JSX.Element} Rendered counter
 */
export const HitDiceCounter: React.FC<HitDiceCounterProps> = ({ vocations }) => {
  const active = vocations.filter((v) => Boolean(v.slug));
  const totalLevel = active.reduce((sum, v) => sum + (v.level ?? 1), 0);

  if (active.length === 0) {
    return <span className={styles.counter}>—</span>;
  }

  const dieFaces = active.map((v) => parseDieFaces(v.hitDie ?? ''));
  const uniqueDice = new Set(dieFaces);
  const isMixed = uniqueDice.size > 1 || dieFaces.some((d) => d === '?');

  const label = isMixed
    ? `${totalLevel}d?`
    : `${totalLevel}d${[...uniqueDice][0]}`;

  if (!isMixed) {
    return <span className={styles.counter}>{label}</span>;
  }

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      {active.map((v, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipVoc}>{v.title || v.slug}</span>
          <span className={styles.tooltipDice}>
            {v.level}d{parseDieFaces(v.hitDie ?? '?')}
          </span>
        </div>
      ))}
      <p className={styles.tooltipNote}>
        Mixed hit dice — keep track of each separately!
      </p>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement='top' maxWidth={220}>
      <span className={`${styles.counter} ${styles.mixed}`}>{label}</span>
    </Tooltip>
  );
};
