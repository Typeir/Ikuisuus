/**
 * @fileoverview Spell Table Filter Hook
 * @description Owns the spell-table UI filter state and derives the
 * JSON-serializable `FilterExpression[]` payload for `/api/spells`.
 * @module lib/hooks/data/useSpellTableFilters
 * @author Typeir
 * @version 1.0.0
 * @since 7.2.0
 */

import type { FilterExpression } from '@/lib/db/content/filters';
import { useMemo, useState } from 'react';

/**
 * Concentration filter tri-state. Empty string means "no filter".
 *
 * @typedef {('' | 'yes' | 'no')} ConcentrationFilter
 */
export type ConcentrationFilter = '' | 'yes' | 'no';

/**
 * UI filter state surface.
 *
 * @interface SpellTableFilterState
 * @property {boolean} damoclesOnly - Hide SRD/basic-source rows when true.
 * @property {string} schoolFilter - Selected school name; empty means all.
 * @property {ConcentrationFilter} concentrationFilter - Concentration tri-state.
 */
export interface SpellTableFilterState {
  damoclesOnly: boolean;
  schoolFilter: string;
  concentrationFilter: ConcentrationFilter;
}

/**
 * UI filter state setters.
 *
 * @interface SpellTableFilterSetters
 * @property {(value: boolean) => void} setDamoclesOnly - Updates the Damocles-only flag.
 * @property {(value: string) => void} setSchoolFilter - Updates the school filter.
 * @property {(value: ConcentrationFilter) => void} setConcentrationFilter - Updates the concentration filter.
 */
export interface SpellTableFilterSetters {
  setDamoclesOnly: (value: boolean) => void;
  setSchoolFilter: (value: string) => void;
  setConcentrationFilter: (value: ConcentrationFilter) => void;
}

/**
 * Combined hook return value.
 *
 * @interface UseSpellTableFiltersResult
 * @property {SpellTableFilterState} state - Current UI filter state.
 * @property {SpellTableFilterSetters} setters - State setters.
 * @property {FilterExpression[]} expressions - Derived filter expressions to forward.
 */
export interface UseSpellTableFiltersResult {
  state: SpellTableFilterState;
  setters: SpellTableFilterSetters;
  expressions: FilterExpression[];
}

/**
 * Manages the spell-table UI filter state and derives the `FilterExpression[]`.
 * `damoclesOnly` emits source neq 'basic', preserving null rows.
 *
 * @returns {UseSpellTableFiltersResult} Filter state, setters, and derived expressions.
 */
export function useSpellTableFilters(): UseSpellTableFiltersResult {
  const [damoclesOnly, setDamoclesOnly] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [concentrationFilter, setConcentrationFilter] =
    useState<ConcentrationFilter>('');

  const expressions = useMemo<FilterExpression[]>(() => {
    const out: FilterExpression[] = [];
    if (damoclesOnly) {
      out.push({ field: 'source', operator: 'neq', value: 'basic' });
    }
    if (schoolFilter) {
      out.push({ field: 'school', operator: 'eq', value: schoolFilter });
    }
    if (concentrationFilter === 'yes') {
      out.push({ field: 'concentration', operator: 'eq', value: true });
    } else if (concentrationFilter === 'no') {
      out.push({ field: 'concentration', operator: 'eq', value: false });
    }
    return out;
  }, [damoclesOnly, schoolFilter, concentrationFilter]);

  return {
    state: { damoclesOnly, schoolFilter, concentrationFilter },
    setters: { setDamoclesOnly, setSchoolFilter, setConcentrationFilter },
    expressions,
  };
}
