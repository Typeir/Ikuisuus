/**
 * @fileoverview Stat Ticker Component
 * @description A perpetual horizontally-scrolling marquee that summarises the
 * key stats of the active character. Provides a compact at-a-glance bar for
 * the character sheet header.
 *
 * The ticker duplicates its content string to create a seamless CSS scroll loop
 * driven by a CSS animation defined in `characterSheet.module.scss`.
 *
 * @module lib/components/characterSheet/statTicker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterSheet } from '@/lib/types/character';
import { computeAbilityModifier } from '@/lib/utils/characterStorage';
import styles from './characterSheet.module.scss';

/**
 * Props for the StatTicker component.
 *
 * @interface StatTickerProps
 * @property {CharacterSheet} character - The character whose stats are displayed
 */
export interface StatTickerProps {
  character: CharacterSheet;
}

/**
 * Build the ticker text string from a character's key stats.
 *
 * @function buildTickerText
 * @param {CharacterSheet} character - Source character sheet
 * @returns {string} Formatted ticker text
 */
function buildTickerText(character: CharacterSheet): string {
  const { abilityScores: ab, hpCurrent, hpMax, ac, level } = character;
  const modStr = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  return [
    `LV ${level}`,
    `HP ${hpCurrent}/${hpMax}`,
    `AC ${ac}`,
    `STR ${ab.str} (${modStr(computeAbilityModifier(ab.str))})`,
    `DEX ${ab.dex} (${modStr(computeAbilityModifier(ab.dex))})`,
    `CON ${ab.con} (${modStr(computeAbilityModifier(ab.con))})`,
    `INT ${ab.int} (${modStr(computeAbilityModifier(ab.int))})`,
    `WIS ${ab.wis} (${modStr(computeAbilityModifier(ab.wis))})`,
    `CHA ${ab.cha} (${modStr(computeAbilityModifier(ab.cha))})`,
  ].join('  ✦  ');
}

/**
 * Scrolling stat ticker bar. Hidden in print mode via SCSS.
 * Duplicates content to allow an infinite seamless animation.
 *
 * @component
 * @param {StatTickerProps} props - Component props
 * @returns {JSX.Element} Rendered stat ticker
 */
export const StatTicker: React.FC<StatTickerProps> = ({ character }) => {
  const text = buildTickerText(character);

  return (
    <div
      className={styles.statTicker}
      aria-label='Character stat ticker'
      aria-live='off'>
      <div className={styles.statTickerTrack}>
        <span aria-hidden='true'>{text}</span>
        <span aria-hidden='true'>{text}</span>
      </div>
    </div>
  );
};
