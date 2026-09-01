/**
 * @fileoverview Spell-table filter state and API payload.
 *
 * @module modules/metadata-tables/application/hooks/useSpellTableFilters
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
 * @property {ConcentrationFilter} concentrationFilter - Concentration tri-state.
 */
export interface SpellTableFilterState {
  concentrationFilter: ConcentrationFilter;
}

/**
 * UI filter state setters.
 *
 * @interface SpellTableFilterSetters
 * @property {(value: ConcentrationFilter) => void} setConcentrationFilter - Updates the concentration filter.
 */
export interface SpellTableFilterSetters {
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
 *
 * @returns {UseSpellTableFiltersResult} Filter state, setters, and derived expressions.
 */
export function useSpellTableFilters(): UseSpellTableFiltersResult {
  const [concentrationFilter, setConcentrationFilter] =
    useState<ConcentrationFilter>('');

  const expressions = useMemo<FilterExpression[]>(() => {
    const out: FilterExpression[] = [];
    if (concentrationFilter === 'yes') {
      out.push({ field: 'concentration', operator: 'eq', value: true });
    } else if (concentrationFilter === 'no') {
      out.push({ field: 'concentration', operator: 'eq', value: false });
    }
    return out;
  }, [concentrationFilter]);

  return {
    state: { concentrationFilter },
    setters: { setConcentrationFilter },
    expressions,
  };
}
