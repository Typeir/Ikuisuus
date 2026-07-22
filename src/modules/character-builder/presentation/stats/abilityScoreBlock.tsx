/**
 * @fileoverview Ability Score Block Component
 * @description Renders a single D&D ability score with its modifier.
 * Displays the score name, numeric value, and computed modifier in a compact
 * block, plus the linked saving throw: a proficiency pip track and computed
 * save bonus. In edit mode exposes a {@link NumericInput} for the score, a
 * roll button (4d6 drop lowest via {@link rollAbilityScore}), and clickable
 * save pips.
 *
 * @module lib/components/characterSheet/abilityScoreBlock
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { NumericInput } from '@/lib/components/ui/numericInput';
import type { TierLevel } from '@/lib/types/character';
import {
    computeAbilityModifier,
    rollAbilityScore,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { computeSaveBonus } from '@/modules/character-builder/lib/utils/proficiencyUtils';
import { Dices } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { ProficiencyTrack } from '../components/ProficiencyTrack';
import styles from './abilityScoreBlock.module.scss';

/**
 * Props for the AbilityScoreBlock component.
 *
 * @interface AbilityScoreBlockProps
 * @property {string} label - Short display label, e.g. `STR`
 * @property {number} score - Raw ability score value, e.g. `16`
 * @property {TierLevel} saveTier - Saving-throw proficiency tier for this ability
 * @property {number} tierBonus - Character tier bonus used for the save calculation
 * @property {boolean} [editing] - Whether the sheet is in edit mode
 * @property {(score: number) => void} [onChange] - Fired when the score changes in edit mode
 * @property {(tier: TierLevel) => void} [onSaveTierChange] - Fired when a save pip is toggled in edit mode
 */
export interface AbilityScoreBlockProps {
  label: string;
  score: number;
  saveTier: TierLevel;
  tierBonus: number;
  editing?: boolean;
  onChange?: (score: number) => void;
  onSaveTierChange?: (tier: TierLevel) => void;
}

/**
 * Renders a single ability score with its computed modifier and saving throw.
 * Shows label, modifier (large), raw score, and a save row (pip track +
 * computed bonus). In edit mode the score becomes a numeric input with a
 * 4d6-drop-lowest roll button and the save pips become clickable.
 *
 * @component
 * @param {AbilityScoreBlockProps} props - Component props
 * @returns {JSX.Element} Rendered ability score block
 */
export const AbilityScoreBlock: React.FC<AbilityScoreBlockProps> = ({
  label,
  score,
  saveTier,
  tierBonus,
  editing = false,
  onChange,
  onSaveTierChange,
}) => {
  const t = useTranslations('characterSheet');
  const mod = computeAbilityModifier(score);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  const saveBonus = computeSaveBonus(saveTier, score, tierBonus);
  const saveStr = saveBonus >= 0 ? `+${saveBonus}` : `${saveBonus}`;

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
            title={t('abilityRollTitle')}
            aria-label={t('abilityRollAria', { label })}
            onClick={handleRoll}>
            <Dices size={14} aria-hidden='true' />
          </button>
        </div>
      ) : (
        <span className={styles.abilityScore}>{score}</span>
      )}
      <div
        className={styles.saveRow}
        aria-label={t('ariaSavingThrow', { label, bonus: saveStr })}>
        <span className={styles.saveLabel}>{t('saveLabel')}</span>
        <ProficiencyTrack
          currentProficiency={saveTier}
          onChange={(tier) => onSaveTierChange?.(tier)}
          readOnly={!editing}
          itemName={`${label}-save`}
        />
        <span className={styles.saveBonus}>{saveStr}</span>
      </div>
    </div>
  );
};
