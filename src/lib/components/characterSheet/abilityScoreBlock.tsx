/**
 * @fileoverview Ability Score Block Component
 * @description Renders a single D&D ability score with its modifier.
 * Displays the score name, numeric value, and computed modifier in a compact block.
 *
 * @module lib/components/characterSheet/abilityScoreBlock
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { computeAbilityModifier } from '@/lib/utils/characterStorage';
import styles from './characterSheet.module.scss';

/**
 * Props for the AbilityScoreBlock component.
 *
 * @interface AbilityScoreBlockProps
 * @property {string} label - Short display label, e.g. `STR`
 * @property {number} score - Raw ability score value, e.g. `16`
 */
export interface AbilityScoreBlockProps {
  label: string;
  score: number;
}

/**
 * Renders a single ability score with its computed modifier.
 * Shows label, modifier (large), and raw score (small).
 *
 * @component
 * @param {AbilityScoreBlockProps} props - Component props
 * @param {string} props.label - Ability abbreviation
 * @param {number} props.score - Raw ability score
 * @returns {JSX.Element} Rendered ability score block
 */
export const AbilityScoreBlock: React.FC<AbilityScoreBlockProps> = ({
  label,
  score,
}) => {
  const mod = computeAbilityModifier(score);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <div
      className={styles.abilityBlock}
      aria-label={`${label}: ${score}, modifier ${modStr}`}>
      <span className={styles.abilityLabel}>{label}</span>
      <span className={styles.abilityMod}>{modStr}</span>
      <span className={styles.abilityScore}>{score}</span>
    </div>
  );
};
