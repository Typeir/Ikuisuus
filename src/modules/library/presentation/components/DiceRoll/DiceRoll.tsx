/**
 * @fileoverview DiceRoll Interactive MDX Component
 * @description Inline MDX component that renders a dice expression as a
 * clickable button. On click, rolls the dice, applies special modifiers
 * (KH1, KL1, DL1, DH1), adds any flat modifier, and displays the result.
 *
 * @module modules/library/presentation/components/DiceRoll/DiceRoll
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { isMaxRoll, isMinRoll, rollDie } from '@/lib/utils/diceUtils';
import React, { useCallback, useId, useState } from 'react';
import styles from './DiceRoll.module.scss';

/**
 * Shape of a roll result for display.
 *
 * @interface RollResult
 * @property {number} total - The final total after specials and modifier
 * @property {number[]} dice - Individual die results before special processing
 * @property {number[]} kept - Dice that were kept after special processing
 * @property {string[]} specialsApplied - List of specials that were applied
 * @property {number | null} modifierValue - Parsed numeric modifier applied, or null
 */
interface RollResult {
  total: number;
  dice: number[];
  kept: number[];
  specialsApplied: string[];
  modifierValue: number | null;
}

/**
 * Props for the DiceRoll component.
 *
 * @typedef {object} DiceRollProps
 * @property {string} dice - Dice notation, e.g. "2d20", "3d6"
 * @property {string} [specials] - Comma-separated special roll types (KH1, KL1, DL1, DH1)
 * @property {string} [modifier] - Signed modifier string, e.g. "+5", "-3"
 * @property {string} [damageType] - Free-text damage type or description
 */
export interface DiceRollProps {
  dice: string;
  specials?: string;
  modifier?: string;
  damageType?: string;
}

/**
 * Parses dice notation "NdM" into count and faces.
 * Returns null for malformed notation.
 *
 * @param {string} notation - Dice notation, e.g. "2d20"
 * @returns {{ count: number; faces: number } | null} Parsed count and faces, or null
 */
function parseDiceNotation(
  notation: string,
): { count: number; faces: number } | null {
  const match = notation.match(/^(\d+)d(\d+)$/);
  if (!match) return null;
  const count = Number.parseInt(match[1], 10);
  const faces = Number.parseInt(match[2], 10);
  if (count < 1 || faces < 2) return null;
  return { count, faces };
}

/**
 * Parses a signed modifier string into a numeric value.
 *
 * @param {string} mod - Signed modifier string, e.g. "+5", "-3"
 * @returns {number} Numeric modifier value
 */
function parseModifier(mod: string): number {
  const cleaned = mod.replace(/\s/g, '');
  return Number.parseInt(cleaned, 10) || 0;
}

/**
 * Applies the KH1 special: keeps only the highest die result.
 *
 * @param {number[]} results - Array of die results
 * @returns {number[]} Array containing only the highest result
 */
function applyKH1(results: number[]): number[] {
  if (results.length === 0) return [];
  const max = Math.max(...results);
  return [max];
}

/**
 * Applies the KL1 special: keeps only the lowest die result.
 *
 * @param {number[]} results - Array of die results
 * @returns {number[]} Array containing only the lowest result
 */
function applyKL1(results: number[]): number[] {
  if (results.length === 0) return [];
  const min = Math.min(...results);
  return [min];
}

/**
 * Applies the DL1 special: drops the lowest die result.
 *
 * @param {number[]} results - Array of die results
 * @returns {number[]} Array with the lowest result removed
 */
function applyDL1(results: number[]): number[] {
  if (results.length <= 1) return [...results];
  const sorted = [...results].sort((a, b) => a - b);
  return sorted.slice(1);
}

/**
 * Applies the DH1 special: drops the highest die result.
 *
 * @param {number[]} results - Array of die results
 * @returns {number[]} Array with the highest result removed
 */
function applyDH1(results: number[]): number[] {
  if (results.length <= 1) return [...results];
  const sorted = [...results].sort((a, b) => a - b);
  return sorted.slice(0, -1);
}

/**
 * Applies a single special to the array of die results.
 *
 * @param {number[]} results - Current die results
 * @param {string} special - Special roll type shortcode
 * @returns {number[]} Results after applying the special
 */
function applySpecial(results: number[], special: string): number[] {
  switch (special) {
    case 'KH1':
      return applyKH1(results);
    case 'KL1':
      return applyKL1(results);
    case 'DL1':
      return applyDL1(results);
    case 'DH1':
      return applyDH1(results);
    default:
      return results;
  }
}

/**
 * Sums an array of numbers.
 *
 * @param {number[]} values - Array of numeric values
 * @returns {number} The sum
 */
function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Builds the display label for the dice expression button.
 *
 * @param {DiceRollProps} props - The component props
 * @returns {string} Formatted expression string
 */
function buildLabel(props: DiceRollProps): string {
  const parts: string[] = [props.dice];
  if (props.specials) {
    const codes = props.specials.split(',').filter(Boolean);
    for (const code of codes) {
      parts.push(`;${code}`);
    }
  }
  if (props.modifier) {
    parts.push(` ${props.modifier}`);
  }
  if (props.damageType) {
    parts.push(` ${props.damageType}`);
  }
  return parts.join('');
}

/** Max dice displayed per row before wrapping to the next line. */
const DICE_PER_ROW = 10;

/**
 * Splits an array into sub-arrays of at most `size` elements.
 *
 * @param {T[]} arr - The array to chunk
 * @param {number} size - Max elements per chunk
 * @returns {T[][]} Array of chunks
 */
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size),
  );
}

/**
 * Interactive dice roll component for MDX content.
 * Renders a clickable dice expression that rolls and displays results
 * in a tooltip above the button. The tooltip fades after inactivity
 * and restores on hover.
 *
 * @param {DiceRollProps} props - The component props
 * @param {string} props.dice - Dice notation, e.g. "2d20"
 * @param {string} [props.specials] - Comma-separated special roll types
 * @param {string} [props.modifier] - Signed modifier string
 * @param {string} [props.damageType] - Damage type description
 * @returns {JSX.Element} The rendered dice roll element
 */
export default function DiceRoll({
  dice,
  specials,
  modifier,
  damageType,
}: DiceRollProps): React.JSX.Element {
  const [result, setResult] = useState<RollResult | null>(null);
  const tooltipId = useId();

  const roll = useCallback(() => {
    const parsed = parseDiceNotation(dice);
    if (!parsed) return;

    const { count, faces } = parsed;
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(rollDie(faces));
    }

    const specialCodes = specials
      ? specials
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let kept = [...results];
    const specialsApplied: string[] = [];
    for (const code of specialCodes) {
      kept = applySpecial(kept, code);
      specialsApplied.push(code);
    }

    const diceTotal = sum(kept);
    const modifierValue = modifier ? parseModifier(modifier) : null;
    const total = diceTotal + (modifierValue ?? 0);

    setResult({
      total,
      dice: results,
      kept,
      specialsApplied,
      modifierValue,
    });
  }, [dice, specials, modifier]);

  const label = buildLabel({ dice, specials, modifier, damageType });

  const rows = result ? chunk(result.dice, DICE_PER_ROW) : [];
  const hasModifier =
    result !== null &&
    result.modifierValue !== null &&
    result.modifierValue !== 0;
  const lastRowIndex = rows.length - 1;

  const tooltipContent = result ? (
    <>
      <span className={styles.diceTooltipTotal}>{result.total}</span>
      <span className={styles.diceTooltipBreakdown}>
        {rows.map((row, ri) => (
          <span key={ri} className={styles.diceRow}>
            {row.map((die, i) => {
              const parsed = parseDiceNotation(dice);
              const faces = parsed?.faces ?? 0;
              const maxClass = isMaxRoll(die, faces) ? ` ${styles.dieMax}` : '';
              const minClass = isMinRoll(die) ? ` ${styles.dieMin}` : '';
              const isKept = result.kept.includes(die);
              const keptClass = isKept ? '' : ` ${styles.dieDropped}`;
              return (
                <span key={i}>
                  {i > 0 && ', '}
                  <span
                    className={`${styles.die}${maxClass}${minClass}${keptClass}`}>
                    {die}
                  </span>
                </span>
              );
            })}
            {ri === lastRowIndex && hasModifier && (
              <span className={styles.dieModifier}>
                {result.modifierValue! > 0 ? ' + ' : ' − '}
                {Math.abs(result.modifierValue!)}
              </span>
            )}
          </span>
        ))}
      </span>
    </>
  ) : null;

  return (
    <Tooltip
      id={`dice-${tooltipId}`}
      content={tooltipContent}
      showDelay={0}
      showArrow={false}
      className={styles.diceTooltip}
      forceVisible={result !== null}
      inline>
      <button
        type='button'
        className={styles.diceButton}
        onClick={roll}
        aria-label={`Roll ${label}`}>
        {label}
      </button>
    </Tooltip>
  );
}
