/**
 * @fileoverview Smoke tests for the filters barrel exports.
 * @description Verifies public exports of the filters barrel.
 */

import { describe, expect, it } from 'vitest';
import {
  applyFiltersInMemory,
  buildFilterQuery,
  isFilterExpression,
  isFilterExpressionArray,
} from '@/lib/db/content/filters';
import type { FilterExpression } from '@/lib/db/content/filters';

describe('filter barrel exports', () => {
  it('isFilterExpression rejects non-objects', () => {
    expect(isFilterExpression(null)).toBe(false);
    expect(isFilterExpression('string')).toBe(false);
    expect(isFilterExpression(42)).toBe(false);
  });

  it('isFilterExpression accepts valid eq expression', () => {
    const expr: FilterExpression = {
      field: 'school',
      operator: 'eq',
      value: 'Evocation',
    };
    expect(isFilterExpression(expr)).toBe(true);
  });

  it('isFilterExpression rejects in without array value', () => {
    expect(
      isFilterExpression({
        field: 'school',
        operator: 'in',
        value: 'Evocation',
      }),
    ).toBe(false);
  });

  it('isFilterExpressionArray accepts empty array', () => {
    expect(isFilterExpressionArray([])).toBe(true);
  });

  it('isFilterExpressionArray rejects array with invalid entry', () => {
    expect(
      isFilterExpressionArray([{ field: '', operator: 'eq', value: 'x' }]),
    ).toBe(false);
  });

  it('buildFilterQuery maps eq to bare value', () => {
    const result = buildFilterQuery([
      { field: 'school', operator: 'eq', value: 'Evocation' },
    ]);
    expect(result).toEqual({ school: 'Evocation' });
  });

  it('buildFilterQuery maps neq to $ne', () => {
    const result = buildFilterQuery([
      { field: 'source', operator: 'neq', value: 'basic' },
    ]);
    expect(result).toEqual({ source: { $ne: 'basic' } });
  });

  it('applyFiltersInMemory returns all records when filters empty', () => {
    const records = [{ name: 'a' }, { name: 'b' }];
    expect(applyFiltersInMemory(records, [])).toEqual(records);
  });

  it('applyFiltersInMemory filters by eq', () => {
    const records = [{ school: 'Evocation' }, { school: 'Abjuration' }];
    const result = applyFiltersInMemory(records, [
      { field: 'school', operator: 'eq', value: 'Evocation' },
    ]);
    expect(result).toEqual([{ school: 'Evocation' }]);
  });
});
