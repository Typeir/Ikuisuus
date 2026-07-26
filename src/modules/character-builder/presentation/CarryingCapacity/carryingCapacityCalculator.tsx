/**
 * @fileoverview Carrying Capacity Calculator
 * @description Live read-out of a character's light / medium / heavy load
 * thresholds based on Strength, size, and bipedal/quadruped status. Includes
 * a carried-weight input and a coloured load bar.
 *
 * @module lib/components/characterSheet/carryingCapacityCalculator
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import { NumericInput } from '@/lib/components/ui/numericInput';
import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { useEquipmentContext } from '@/modules/character-builder/application/context/equipmentContext';
import type { CreatureSize } from '@/modules/character-builder/domain/carrying-capacity';
import { computeCapacity } from '@/modules/character-builder/infrastructure/carrying-capacity';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './carryingCapacityCalculator.module.scss';

/**
 * Possible size options offered to the user.
 */
const SIZE_OPTIONS: CreatureSize[] = [
  'fine',
  'diminutive',
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'gargantuan',
  'colossal',
];

/**
 * Determines the load tier for a given carried weight.
 *
 * @function classifyLoad
 * @param {number} carried - Carried weight in pounds
 * @param {{light:number;medium:number;heavy:number}} thresholds - Load thresholds
 * @returns {'none'|'light'|'medium'|'heavy'|'over'} Load tier
 */
const classifyLoad = (
  carried: number,
  thresholds: { light: number; medium: number; heavy: number },
): 'none' | 'light' | 'medium' | 'heavy' | 'over' => {
  if (carried <= 0) return 'none';
  if (carried <= thresholds.light) return 'light';
  if (carried <= thresholds.medium) return 'medium';
  if (carried <= thresholds.heavy) return 'heavy';
  return 'over';
};

/**
 * Carrying capacity panel. Reads Strength from the active-sheet context and
 * carried weight from the equipment context.
 *
 * @component
 * @returns {JSX.Element} Rendered calculator
 */
export const CarryingCapacityCalculator: React.FC = () => {
  const data = useSheetData();
  const strength = data.abilityScores?.str ?? 10;
  const { totalWeight } = useEquipmentContext();

  const [size, setSize] = useState<CreatureSize>('medium');
  const [isQuadruped, setIsQuadruped] = useState(false);
  const [carried, setCarried] = useState(0);
  const t = useTranslations('characterSheet');

  const effectiveCarried = totalWeight > 0 ? totalWeight + carried : carried;

  const thresholds = computeCapacity(strength, size, isQuadruped);
  const tier = classifyLoad(effectiveCarried, thresholds);

  const fillPct =
    thresholds.heavy > 0
      ? Math.min(100, (effectiveCarried / thresholds.heavy) * 100)
      : 0;

  return (
    <div className={styles.calculator}>
      <div className={styles.controls}>
        <label className={styles.controlField}>
          <span className={styles.controlLabel}>
            {t('carryingCapacitySize')}
          </span>
          <select
            className={styles.select}
            value={size}
            onChange={(e) => setSize(e.target.value as CreatureSize)}>
            {SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.controlField}>
          <span className={styles.controlLabel}>
            {t('carryingCapacityQuadruped')}
          </span>
          <input
            type='checkbox'
            className={styles.checkbox}
            checked={isQuadruped}
            onChange={(e) => setIsQuadruped(e.target.checked)}
            aria-label={t('carryingCapacityQuadruped')}
          />
        </label>
        <label className={styles.controlField}>
          <span className={styles.controlLabel}>
            {t('carryingCapacityCarried')}
          </span>
          <NumericInput
            value={carried}
            min={0}
            size='sm'
            className={styles.numberInput}
            ariaLabel={t('carryingCapacityCarriedAria')}
            onChange={(v) => setCarried(Math.max(0, v ?? 0))}
          />
        </label>
      </div>

      <div className={styles.thresholds}>
        <Chip
          label={t('carryingCapacityLight', { weight: thresholds.light })}
          variant='success'
        />
        <Chip
          label={t('carryingCapacityMedium', { weight: thresholds.medium })}
          variant='warning'
        />
        <Chip
          label={t('carryingCapacityHeavy', { weight: thresholds.heavy })}
          variant='danger'
        />
      </div>

      <div className={styles.bar}>
        <div
          className={styles.fill}
          data-tier={tier}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className={styles.tierLabel} data-tier={tier}>
        {tier === 'none' && 'No load'}
        {tier === 'light' && 'Light load'}
        {tier === 'medium' && 'Medium load'}
        {tier === 'heavy' && 'Heavy load'}
        {tier === 'over' && 'Over capacity'}
      </div>
    </div>
  );
};
