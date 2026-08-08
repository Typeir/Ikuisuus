/**
 * @fileoverview Unit Inline MDX Component
 * @description Inline MDX component that renders a Damocles measure in the
 * reader's chosen display system. The server always renders the native stride
 * form, so server markup and first client paint agree; the stored preference
 * takes over once persistent state has hydrated.
 *
 * Every rendering links to the Measures rule page, which both defines the units
 * and hosts the switcher. The accessible name carries all three systems so the
 * measure is legible regardless of which one is shown.
 *
 * The other two systems are shown in the wiki tooltip rather than the browser's
 * `title` popup. The tooltip renders nothing until it has mounted, so static
 * output and first client paint are both the bare link, and it is attached in
 * inline mode so a measure sitting mid-sentence is not wrapped in a flex box
 * that would break the line around it.
 *
 * @module modules/library/presentation/components/Unit/Unit
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { useUnitSystemState } from '@/lib/hooks/useUnitSystem';
import type { UnitName } from '@/lib/md/unitExpressionParser';
import type { UnitSystemValue } from '@/lib/types/persistentUiState';
import {
  allUnitRenderings,
  convertFraction,
  dimensionOf,
  formatUnit,
} from '@/lib/units/unitConversion';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';
import styles from './Unit.module.scss';

/** Translator shape used for fraction prose. */
type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Renders a fractional measure as prose.
 *
 * The fraction is scaled into the target system first, so the wording follows
 * the converted value rather than the native one. English fraction prose is
 * irregular around a half, which gets its own templates.
 *
 * @param {Translate} t - Translator scoped to the `units` namespace
 * @param {number} numerator - Native fraction numerator
 * @param {number} denominator - Native fraction denominator
 * @param {UnitName} unit - The native unit
 * @param {UnitSystemValue} system - Display system
 * @returns {string} The rendered prose
 */
function formatFraction(
  t: Translate,
  numerator: number,
  denominator: number,
  unit: UnitName,
  system: UnitSystemValue,
): string {
  const f = convertFraction(numerator, denominator, unit, system);
  const key = `${f.numerator}_${f.denominator}`;
  const isHalf = f.numerator === 1 && f.denominator === 2;

  if (f.numerator === 0) {
    return t('fraction.whole', { value: f.whole, unit: f.noun });
  }

  const amount = t(`fraction.amount.${key}`);

  if (f.whole === 0) {
    return isHalf
      ? t('fraction.halfA', { unit: f.singularNoun })
      : t('fraction.ofA', { amount, unit: f.singularNoun });
  }

  return isHalf
    ? t('fraction.mixedHalf', { whole: f.whole, unit: f.noun })
    : t('fraction.mixed', { whole: f.whole, amount, unit: f.noun });
}

/**
 * Props for the Unit component. All values arrive as strings from the MDX
 * attribute layer.
 *
 * @typedef {object} UnitProps
 * @property {string} value - Whole-number quantity, or fraction numerator
 * @property {UnitName} unit - Native unit name
 * @property {string} [denominator] - Fraction denominator; absent for whole quantities
 * @property {string} [flags] - Comma-separated flag shortcodes, e.g. "ADJ"
 */
export interface UnitProps {
  value: string;
  unit: UnitName;
  denominator?: string;
  flags?: string;
  /** When true, renders a `<span>` instead of an `<a>` to avoid nested anchors in tables. */
  noLink?: boolean;
}

/**
 * Path of the rule page that defines the measures and hosts the switcher.
 *
 * @constant
 */
const MEASURES_PATH = 'library/rules/steel-and-strife/measures';

/**
 * Renders a Damocles measure, converted to the reader's preferred system.
 *
 * @param {UnitProps} props - Component props
 * @returns {React.ReactElement} The rendered measure as a link
 */
export const Unit: React.FC<UnitProps> = ({
  value,
  unit,
  denominator,
  flags,
  noLink = false,
}) => {
  const { unitSystem } = useUnitSystemState();
  const locale = useLocale();
  const t = useTranslations('units');

  const numerator = Number.parseInt(value, 10);
  const divisor = denominator ? Number.parseInt(denominator, 10) : 1;
  const attributive = (flags ?? '').split(',').includes('ADJ');

  const system = unitSystem[dimensionOf(unit)];

  const isFraction = divisor !== 1;

  const label = isFraction
    ? formatFraction(t, numerator, divisor, unit, system)
    : formatUnit(numerator, unit, system, attributive);

  const renderings = isFraction
    ? (['stride', 'metric', 'imperial'] as const).map((mode) =>
        formatFraction(t, numerator, divisor, unit, mode),
      )
    : allUnitRenderings(numerator, unit, attributive);

  return (
    <Tooltip
      content={renderings.map((rendering) => (
        <span key={rendering} className={styles.rendering}>
          {rendering}
        </span>
      ))}
      className={styles.tooltip}
      showArrow={false}
      inline
    >
      {noLink ? (
        <span
          className={styles.unit}
          aria-label={t('ariaLabel', { renderings: renderings.join(', ') })}
          data-unit={unit}
          data-unit-system={system}
        >
          {label}
        </span>
      ) : (
        <a
          className={styles.unit}
          href={`/${locale}/${MEASURES_PATH}`}
          aria-label={t('ariaLabel', { renderings: renderings.join(', ') })}
          data-unit={unit}
          data-unit-system={system}
        >
          {label}
        </a>
      )}
    </Tooltip>
  );
};

export default Unit;
