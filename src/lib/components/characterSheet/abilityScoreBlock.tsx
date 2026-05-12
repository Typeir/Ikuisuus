/**
 * @fileoverview Ability Score Block Component
 * @description Renders a single D&D ability score with its modifier.
 * Displays the score name, numeric value, and computed modifier in a compact block.
 * In edit mode exposes a {@link NumericInput} for the score and a roll button
 * (4d6 drop lowest via {@link rollAbilityScore}).
 *
 * @module lib/components/characterSheet/abilityScoreBlock
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import {
  computeAbilityModifier,
  rollAbilityScore,
} from '@/lib/utils/characterStorage';
import { Dices } from 'lucide-react';
import { useCallback } from 'react';
import styles from './abilityScoreBlock.module.scss';

/**
 * Props for the AbilityScoreBlock component.
 *
 * @interface AbilityScoreBlockProps
 * @property {string} label - Short display label, e.g. `STR`
 * @property {number} score - Raw ability score value, e.g. `16`
 * @property {boolean} [editing] - Whether the sheet is in edit mode
 * @property {(score: number) => void} [onChange] - Fired when the score changes in edit mode
 */
export interface AbilityScoreBlockProps {
  label: string;
  score: number;
  editing?: boolean;
  onChange?: (score: number) => void;
}

/**
 * Renders a single ability score with its computed modifier.
 * Shows label, modifier (large), and raw score (small) in view mode.
 * In edit mode shows a numeric input and a 4d6-drop-lowest roll button.
 *
 * @component
 * @param {AbilityScoreBlockProps} props - Component props
 * @param {string} props.label - Ability abbreviation
 * @param {number} props.score - Raw ability score
 * @param {boolean} [props.editing] - Whether edit mode is active
 * @param {(score: number) => void} [props.onChange] - Score change callback
 * @returns {JSX.Element} Rendered ability score block
 */
export const AbilityScoreBlock: React.FC<AbilityScoreBlockProps> = ({
  label,
  score,
  editing = false,
  onChange,
}) => {
  const mod = computeAbilityModifier(score);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  const handleRoll = useCallback(() => {
    onChange?.(rollAbilityScore());
  }, [onChange]);

  return (
    <div
      className={styles.abilityBlock}
      aria-label={`${label}: ${score}, modifier ${modStr}`}>
      <span className={styles.abilityLabel}>{label}</span>
      <span className={styles.abilityMod}>{modStr}</span>
      {editing ? (
        <div className={styles.abilityEditRow}>
          <NumericInput
            value={score}
            min={1}
            max={30}
            size='sm'
            className={styles.abilityScoreInput}
            ariaLabel={label}
            onChange={(v) => onChange?.(v ?? score)}
          />
          <button
            type='button'
            className={styles.abilityRollBtn}
            title='Roll 4d6 drop lowest'
            aria-label={`Roll ${label}`}
            onClick={handleRoll}>
            <Dices size={14} aria-hidden='true' />
          </button>
        </div>
      ) : (
        <span className={styles.abilityScore}>{score}</span>
      )}
    </div>
  );
};
