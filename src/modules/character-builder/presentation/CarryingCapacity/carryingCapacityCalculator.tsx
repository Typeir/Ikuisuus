/**
 * @fileoverview Carrying Capacity Calculator
 * @description Displays light/medium/heavy load thresholds from Strength,
 * size, and quadruped status.
 *
 * @module modules/character-builder/presentation/CarryingCapacity/carryingCapacityCalculator
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Chip } from '@/lib/components/ui/chip';
import { NumericInput } from '@/lib/components/ui/numericInput';
import {
  LOAD_LABELS,
  computeCarryStatus,
  loadFlagCode,
  resolveCarrying,
} from '@/modules/character-builder/application/builderCore/builderMetrics';
import {
  useSheetData,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import type {
  CarryingInputs,
  CreatureSize,
} from '@/modules/character-builder/domain/carrying-capacity';
import { PipCheckbox } from '@/modules/character-builder/presentation/components/PipCheckbox';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
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
 * Carrying capacity panel.
 *
 * @component
 * @returns {JSX.Element} Rendered calculator
 */
export const CarryingCapacityCalculator: React.FC = () => {
  const data = useSheetData();
  const { patch } = useSheetMutators();
  const t = useTranslations('characterSheet');

  const { size, quadruped, extraLb } = resolveCarrying(data);
  const {
    carriedLb: effectiveCarried,
    thresholds,
    tier,
  } = useMemo(() => computeCarryStatus(data), [data]);
  const flagCode = loadFlagCode(tier);

  const setCarrying = useCallback(
    (next: CarryingInputs) =>
      patch({ carrying: { ...data.carrying, ...next } }),
    [data.carrying, patch],
  );

  const fillPct =
    thresholds.heavy > 0
      ? Math.min(100, (effectiveCarried / thresholds.heavy) * 100)
      : 0;

  return (
    <div className={styles.calculator}>
      <div className={styles.controls}>
        <label
          className={styles.controlField}
          data-testid='builder-carry-size'
          data-screenshot-action='set-carry-size'>
          <span className={styles.controlLabel}>
            {t('carryingCapacitySize')}
          </span>
          <select
            className={styles.select}
            value={size}
            onChange={(e) =>
              setCarrying({ size: e.target.value as CreatureSize })
            }>
            {SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <div
          className={styles.controlField}
          data-testid='builder-carry-quadruped'
          data-screenshot-action='toggle-carry-quadruped'>
          <span className={styles.controlLabel}>
            {t('carryingCapacityQuadruped')}
          </span>
          <PipCheckbox
            checked={quadruped}
            onChange={(next) => setCarrying({ quadruped: next })}
            ariaLabel={t('carryingCapacityQuadruped')}
            size='lg'
          />
        </div>
        <label
          className={styles.controlField}
          data-testid='builder-carry-extra'
          data-screenshot-action='set-carry-extra'>
          <span className={styles.controlLabel}>
            {t('carryingCapacityCarried')}
          </span>
          <NumericInput
            value={extraLb}
            min={0}
            size='sm'
            className={styles.numberInput}
            ariaLabel={t('carryingCapacityCarriedAria')}
            onChange={(v) => setCarrying({ extraLb: Math.max(0, v ?? 0) })}
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
      <div
        className={styles.tierLabel}
        data-tier={tier}
        data-testid={flagCode ? 'builder-flag' : 'builder-carry-tier'}
        data-flag-code={flagCode ?? undefined}>
        {LOAD_LABELS[tier]}
      </div>
    </div>
  );
};
