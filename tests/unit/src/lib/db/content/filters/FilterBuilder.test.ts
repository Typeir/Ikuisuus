/**
 * @fileoverview Unit tests for FilterBuilder DSL
 * @module tests/unit/src/lib/db/content/filters/FilterBuilder.test
 * @version 1.0.0
 * @author Typeir
 * @since 7.2.0
 */

import {
    applyFiltersInMemory,
    buildFilterQuery,
    isFilterExpression,
    isFilterExpressionArray,
    type FilterExpression,
} from '@/lib/db/content/filters';
import { describe, expect, it } from 'vitest';

describe('buildFilterQuery', () => {
  it('returns an empty object for an empty filter array', () => {
    expect(buildFilterQuery([])).toEqual({});
  });

  it('maps eq to a bare equality value', () => {
    const filters: FilterExpression[] = [
      { field: 'school', operator: 'eq', value: 'Evocation' },
    ];
    expect(buildFilterQuery(filters)).toEqual({ school: 'Evocation' });
  });

  it('maps neq to $ne', () => {
    const filters: FilterExpression[] = [
      { field: 'source', operator: 'neq', value: 'basic' },
    ];
    expect(buildFilterQuery(filters)).toEqual({ source: { $ne: 'basic' } });
  });

  it('maps in to $in', () => {
    const filters: FilterExpression[] = [
      { field: 'slug', operator: 'in', value: ['fireball', 'mage-hand'] },
    ];
    expect(buildFilterQuery(filters)).toEqual({
      slug: { $in: ['fireball', 'mage-hand'] },
    });
  });

  it('maps nin to $nin', () => {
    const filters: FilterExpression[] = [
      { field: 'level', operator: 'nin', value: [0, 1] },
    ];
    expect(buildFilterQuery(filters)).toEqual({ level: { $nin: [0, 1] } });
  });

  it('AND-composes expressions on different fields', () => {
    const filters: FilterExpression[] = [
      { field: 'source', operator: 'neq', value: 'basic' },
      { field: 'school', operator: 'eq', value: 'Evocation' },
    ];
    expect(buildFilterQuery(filters)).toEqual({
      source: { $ne: 'basic' },
      school: 'Evocation',
    });
  });

  it('merges multiple expressions on the same field', () => {
    const filters: FilterExpression[] = [
      { field: 'source', operator: 'neq', value: 'basic' },
      { field: 'source', operator: 'in', value: ['basic', 'damocles'] },
    ];
    expect(buildFilterQuery(filters)).toEqual({
      source: { $ne: 'basic', $in: ['basic', 'damocles'] },
    });
  });

  it('promotes a bare-value eq when a second operator follows on the same field', () => {
    const filters: FilterExpression[] = [
      { field: 'school', operator: 'eq', value: 'Evocation' },
      { field: 'school', operator: 'in', value: ['Evocation', 'Conjuration'] },
    ];
    expect(buildFilterQuery(filters)).toEqual({
      school: { $eq: 'Evocation', $in: ['Evocation', 'Conjuration'] },
    });
  });

  it('throws on an unsupported operator', () => {
    const bogus = [
      { field: 'foo', operator: 'gt', value: 1 },
    ] as unknown as FilterExpression[];
    expect(() => buildFilterQuery(bogus)).toThrow(
      /Unsupported filter operator/,
    );
  });
});

describe('isFilterExpression', () => {
  it('accepts a well-formed eq expression', () => {
    expect(
      isFilterExpression({ field: 'school', operator: 'eq', value: 'x' }),
    ).toBe(true);
  });

  it('rejects a non-object', () => {
    expect(isFilterExpression(null)).toBe(false);
    expect(isFilterExpression(42)).toBe(false);
    expect(isFilterExpression('eq')).toBe(false);
  });

  it('rejects an empty field name', () => {
    expect(isFilterExpression({ field: '', operator: 'eq', value: 'x' })).toBe(
      false,
    );
  });

  it('rejects an unknown operator', () => {
    expect(isFilterExpression({ field: 'a', operator: 'gt', value: 1 })).toBe(
      false,
    );
  });

  it('requires an array value for in', () => {
    expect(isFilterExpression({ field: 'a', operator: 'in', value: 'x' })).toBe(
      false,
    );
    expect(
      isFilterExpression({ field: 'a', operator: 'in', value: ['x'] }),
    ).toBe(true);
  });

  it('requires an array value for nin', () => {
    expect(
      isFilterExpression({ field: 'a', operator: 'nin', value: 'x' }),
    ).toBe(false);
    expect(
      isFilterExpression({ field: 'a', operator: 'nin', value: ['x'] }),
    ).toBe(true);
  });
});

describe('isFilterExpressionArray', () => {
  it('accepts an empty array', () => {
    expect(isFilterExpressionArray([])).toBe(true);
  });

  it('accepts an array of valid expressions', () => {
    expect(
      isFilterExpressionArray([
        { field: 'a', operator: 'eq', value: 1 },
        { field: 'b', operator: 'in', value: [1, 2] },
      ]),
    ).toBe(true);
  });

  it('rejects a non-array', () => {
    expect(isFilterExpressionArray({ field: 'a' })).toBe(false);
    expect(isFilterExpressionArray(null)).toBe(false);
  });

  it('rejects when any entry is invalid', () => {
    expect(
      isFilterExpressionArray([
        { field: 'a', operator: 'eq', value: 1 },
        { field: 'b', operator: 'gt', value: 1 },
      ]),
    ).toBe(false);
  });
});

describe('applyFiltersInMemory', () => {
  type Spell = {
    slug: string;
    school: string;
    source: string | null;
    concentration: boolean;
  };
  const spells: Spell[] = [
    { slug: 'a', school: 'Evocation', source: null, concentration: false },
    { slug: 'b', school: 'Evocation', source: 'basic', concentration: true },
    {
      slug: 'c',
      school: 'Conjuration',
      source: 'basic',
      concentration: false,
    },
    { slug: 'd', school: 'Conjuration', source: null, concentration: true },
  ];

  it('returns input untouched when no filters are passed', () => {
    expect(applyFiltersInMemory(spells, [])).toEqual(spells);
  });

  it('filters by neq preserving null fields', () => {
    const result = applyFiltersInMemory(spells, [
      { field: 'source', operator: 'neq', value: 'basic' },
    ]);
    expect(result.map((s) => s.slug)).toEqual(['a', 'd']);
  });

  it('filters by eq', () => {
    const result = applyFiltersInMemory(spells, [
      { field: 'school', operator: 'eq', value: 'Evocation' },
    ]);
    expect(result.map((s) => s.slug)).toEqual(['a', 'b']);
  });

  it('filters by in', () => {
    const result = applyFiltersInMemory(spells, [
      { field: 'slug', operator: 'in', value: ['a', 'c'] },
    ]);
    expect(result.map((s) => s.slug)).toEqual(['a', 'c']);
  });

  it('filters by nin', () => {
    const result = applyFiltersInMemory(spells, [
      { field: 'slug', operator: 'nin', value: ['a', 'c'] },
    ]);
    expect(result.map((s) => s.slug)).toEqual(['b', 'd']);
  });

  it('AND-composes multiple filters', () => {
    const result = applyFiltersInMemory(spells, [
      { field: 'source', operator: 'neq', value: 'basic' },
      { field: 'concentration', operator: 'eq', value: true },
    ]);
    expect(result.map((s) => s.slug)).toEqual(['d']);
  });
});
